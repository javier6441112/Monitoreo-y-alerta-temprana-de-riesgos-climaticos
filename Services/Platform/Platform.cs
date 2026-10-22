using System.Data.Common;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;

namespace WeatherRisk.Platform;

public sealed class ApiError(int status, string message) : Exception(message)
{
    public int Status { get; } = status;
}

public static class Hosting
{
    public static string Required(IConfiguration config, string name) =>
        config[name] is { Length: > 0 } value ? value : throw new InvalidOperationException($"Missing configuration: {name}");

    public static void AddPlatform(this WebApplicationBuilder builder)
    {
        // Hosting and proxy URI logs can contain SignalR access_token query values.
        builder.Logging.AddFilter("Microsoft.AspNetCore.Hosting.Diagnostics", LogLevel.Warning);
        builder.Logging.AddFilter("Yarp.ReverseProxy", LogLevel.Warning);
        var key = Required(builder.Configuration, "JWT_KEY");
        if (Encoding.UTF8.GetByteCount(key) < 32) throw new InvalidOperationException("JWT_KEY requires at least 32 bytes.");
        if (Encoding.UTF8.GetByteCount(Required(builder.Configuration, "SERVICE_KEY")) < 32)
            throw new InvalidOperationException("SERVICE_KEY requires at least 32 bytes.");
        builder.Services.AddHttpClient("peers", c => c.Timeout = TimeSpan.FromSeconds(10));
        builder.Services.AddSingleton<Peers>();
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
        {
            options.MapInboundClaims = false;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
                ValidateIssuer = true, ValidIssuer = Required(builder.Configuration, "JWT_ISSUER"),
                ValidateAudience = true, ValidAudience = Required(builder.Configuration, "JWT_AUDIENCE"),
                ValidateLifetime = true, RequireExpirationTime = true, ClockSkew = TimeSpan.Zero,
                RoleClaimType = "role", NameClaimType = "name"
            };
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    if (context.Request.Path.StartsWithSegments("/hubs") && context.Request.Query.TryGetValue("access_token", out var token))
                        context.Token = token;
                    return Task.CompletedTask;
                },
                OnTokenValidated = async context =>
                {
                    try
                    {
                        var raw = context.Request.Headers.Authorization.ToString();
                        if (string.IsNullOrEmpty(raw)) raw = "Bearer " + context.Request.Query["access_token"];
                        var result = await context.HttpContext.RequestServices.GetRequiredService<Peers>()
                            .Post("AUTH_URL", "/internal/auth/introspect", new { token = raw[7..] });
                        if (result?["active"]?.GetValue<bool>() != true) context.Fail("Session is inactive.");
                    }
                    catch { context.Fail("Identity service unavailable or session invalid."); }
                }
            };
        });
        builder.Services.AddAuthorization();
        builder.Services.AddHealthChecks();
        builder.Services.Configure<HostOptions>(o => o.ShutdownTimeout = TimeSpan.FromSeconds(30));
    }

    public static void UsePlatform(this WebApplication app, string name)
    {
        app.Use(async (context, next) =>
        {
            context.Response.Headers["X-Correlation-ID"] = context.TraceIdentifier;
            try
            {
                if (context.Request.Path.StartsWithSegments("/internal"))
                {
                    var expected = Encoding.UTF8.GetBytes(Required(app.Configuration, "SERVICE_KEY"));
                    var actual = Encoding.UTF8.GetBytes(context.Request.Headers["X-Service-Key"].ToString());
                    if (!CryptographicOperations.FixedTimeEquals(expected, actual))
                        throw new ApiError(401, "Invalid service credentials.");
                }
                await next(context);
            }
            catch (Exception error) when (!context.Response.HasStarted && error is JsonException or FormatException or BadHttpRequestException)
            {
                await Results.Problem(statusCode: 400, title: "Invalid request.").ExecuteAsync(context);
            }
            catch (ApiError error) when (!context.Response.HasStarted)
            {
                await Results.Problem(statusCode: error.Status, title: error.Message,
                    extensions: new Dictionary<string, object?> { ["traceId"] = context.TraceIdentifier }).ExecuteAsync(context);
            }
            catch (Exception error) when (!context.Response.HasStarted)
            {
                app.Logger.LogError(error, "Request failed {TraceId}", context.TraceIdentifier);
                await Results.Problem(statusCode: 503, title: "Service unavailable.",
                    extensions: new Dictionary<string, object?> { ["traceId"] = context.TraceIdentifier }).ExecuteAsync(context);
            }
            finally { app.Logger.LogInformation("{Method} {Path} {Status}", context.Request.Method, context.Request.Path, context.Response.StatusCode); }
        });
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapGet("/health", () => Results.Ok(new { status = "ok", service = name }));
        app.MapHealthChecks("/ready", new HealthCheckOptions());
    }

    public static string Text(JsonObject body, string name, int max = 200)
    {
        var value = body[name]?.GetValue<string>()?.Trim();
        if (string.IsNullOrWhiteSpace(value) || value.Length > max) throw new ApiError(400, $"Invalid {name}.");
        return value;
    }
    public static int Id(JsonObject body, string name)
    {
        if (body[name] is not JsonValue v || !v.TryGetValue<int>(out var id) || id <= 0) throw new ApiError(400, $"Invalid {name}.");
        return id;
    }
    public static string Query(HttpRequest request) => request.QueryString.Value ?? "";
    public static string Actor(HttpContext context) => context.User.FindFirstValue("sub") ?? "system";
    public static DateTime? Date(HttpRequest request, string key)
    {
        if (!request.Query.TryGetValue(key, out var raw)) return null;
        if (!DateTimeOffset.TryParse(raw, out var value)) throw new ApiError(400, $"Invalid {key}.");
        return value.UtcDateTime;
    }
}

public sealed class Peers(IHttpClientFactory factory, IConfiguration config, ILogger<Peers> logger)
{
    public async Task<JsonNode?> Get(string service, string path) => await Send(service, path, null);
    public async Task<JsonNode?> Post(string service, string path, object body) => await Send(service, path, body);
    private async Task<JsonNode?> Send(string service, string path, object? body)
    {
        using var request = new HttpRequestMessage(body is null ? HttpMethod.Get : HttpMethod.Post,
            Hosting.Required(config, service).TrimEnd('/') + path);
        request.Headers.Add("X-Service-Key", Hosting.Required(config, "SERVICE_KEY"));
        if (body is not null) request.Content = JsonContent.Create(body);
        using var response = await factory.CreateClient("peers").SendAsync(request);
        if (!response.IsSuccessStatusCode)
            throw new ApiError(response.StatusCode == System.Net.HttpStatusCode.NotFound ? 404 : 503, $"Dependency {service} failed.");
        var content = await response.Content.ReadAsStringAsync();
        return string.IsNullOrEmpty(content) ? null : JsonNode.Parse(content);
    }
    public async Task Audit(string user, string action, string entity, object? id = null)
    {
        try { await Post("AUDIT_URL", "/internal/audit/events", new { eventId = Guid.NewGuid().ToString(), usuarioId = user, accion = action, entidad = entity, entidadId = id, descripcion = action, fechaHora = DateTime.UtcNow }); }
        catch (Exception error) { logger.LogError(error, "Audit delivery failed for {Action} {Entity}", action, entity); }
    }
}

public sealed class Database(Func<DbConnection> create) : IHealthCheck
{
    public DbConnection Create() => create();
    public async Task<JsonArray> Query(string sql, Dictionary<string, object?>? parameters = null)
    {
        await using var connection = create();
        await connection.OpenAsync();
        return await QueryOn(connection, null, sql, parameters);
    }
    public async Task<int> Execute(string sql, Dictionary<string, object?>? parameters = null)
    {
        await using var connection = create();
        await connection.OpenAsync();
        return await ExecuteOn(connection, null, sql, parameters);
    }
    public static DbCommand Command(DbConnection connection, DbTransaction? transaction, string sql, Dictionary<string, object?>? parameters)
    {
        var command = connection.CreateCommand();
        command.CommandText = sql; command.Transaction = transaction; command.CommandTimeout = 15;
        foreach (var (name, value) in parameters ?? [])
        {
            var parameter = command.CreateParameter(); parameter.ParameterName = name; parameter.Value = value ?? DBNull.Value;
            command.Parameters.Add(parameter);
        }
        return command;
    }
    public static async Task<int> ExecuteOn(DbConnection connection, DbTransaction? transaction, string sql, Dictionary<string, object?>? parameters = null)
    {
        await using var command = Command(connection, transaction, sql, parameters);
        return await command.ExecuteNonQueryAsync();
    }
    public static async Task<JsonArray> QueryOn(DbConnection connection, DbTransaction? transaction, string sql, Dictionary<string, object?>? parameters = null)
    {
        await using var command = Command(connection, transaction, sql, parameters);
        await using var reader = await command.ExecuteReaderAsync();
        var rows = new JsonArray();
        while (await reader.ReadAsync())
        {
            var row = new JsonObject();
            for (var i = 0; i < reader.FieldCount; i++)
            {
                var value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                if (value is DateTime date) value = DateTime.SpecifyKind(date, DateTimeKind.Utc);
                row[reader.GetName(i)] = JsonSerializer.SerializeToNode(value);
            }
            rows.Add(row);
        }
        return rows;
    }
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try { await Query("SELECT 1"); return HealthCheckResult.Healthy(); }
        catch { return HealthCheckResult.Unhealthy("Database unavailable"); }
    }
}
