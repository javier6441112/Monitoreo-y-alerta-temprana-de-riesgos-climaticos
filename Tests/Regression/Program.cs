using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using WeatherRisk.Api.Data;
using WeatherRisk.Api.DependencyInjection;
using WeatherRisk.Api.DTOs;
using WeatherRisk.Api.DTOs.Auth;
using WeatherRisk.Api.DTOs.Dashboard;
using WeatherRisk.Api.DTOs.Historial;
using WeatherRisk.Api.DTOs.Lecturas;
using WeatherRisk.Api.DTOs.Sensores;
using WeatherRisk.Api.DTOs.Usuarios;
using WeatherRisk.Api.Hubs;
using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;
using WeatherRisk.Api.Services;

var tests = new (string Name, Func<Task> Run)[]
{
    ("Dependencias de todos los servicios resuelven en un scope", DependencyResolution),
    ("Login emite JWT válido y rechaza credenciales o usuario inactivo", Authentication),
    ("Usuarios rechaza duplicados y no persiste contraseña en texto", Users),
    ("Comunidades conserva filtros y normalización", Communities),
    ("Sensores conserva metadatos y lectura al actualizar", Sensors),
    ("Lecturas rechaza sensores inválidos y tipos sin reglas", InvalidReadings),
    ("Lectura válida evalúa alertas y publica actualización", ValidReading),
    ("Alertas conserva límites inclusivos, historial y auditoría", Alerts),
    ("Dashboard e historial conservan filtros y resultados", DashboardAndHistory)
};

foreach (var test in tests)
{
    try
    {
        await test.Run();
        Console.WriteLine($"PASS {test.Name}");
    }
    catch (Exception ex)
    {
        Environment.ExitCode = 1;
        Console.Error.WriteLine($"FAIL {test.Name}: {ex}");
    }
}

static IConfiguration Configuration() => new ConfigurationBuilder().AddInMemoryCollection(
    new Dictionary<string, string?>
    {
        ["Jwt:Key"] = "regression-only-key-at-least-32-characters-long",
        ["Jwt:Issuer"] = "WeatherRisk.Regression"
    }).Build();

static Task DependencyResolution()
{
    var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Development" });
    var services = builder.Services;
    services.AddSingleton(Configuration());
    services.AddLogging();
    services.AddSignalR();
    services.AddDbContext<WeatherDbContext>(options => options.UseSqlServer(
        "Server=localhost;Database=RegressionNotConnected;Integrated Security=True;TrustServerCertificate=True"));
    services.AddWeatherRiskApplication();
    using var application = builder.Build();
    using var scope = application.Services.CreateScope();
    Type[] contracts = [typeof(IAuthService), typeof(IUsuariosService), typeof(IComunidadService),
        typeof(ISensoresService), typeof(ILecturasService), typeof(IAlertasService), typeof(IHistorialService),
        typeof(IBitacoraService), typeof(IDashboardService), typeof(IMonitoreoService),
        typeof(IConfiguracionAlertaService), typeof(IAlertEvaluationService), typeof(TokenRevocationService)];
    foreach (var contract in contracts) scope.ServiceProvider.GetRequiredService(contract);
    return Task.CompletedTask;
}

static async Task Authentication()
{
    var user = new Usuario { Id = 7, Username = "tester", Nombre = "Prueba", Rol = "ADMIN",
        Activo = true, PasswordHash = PasswordHasher.Hash("valid-password") };
    var updates = 0;
    var repository = RepositoryStub.Create<IUsuarioRepository>((method, args) => method switch
    {
        nameof(IUsuarioRepository.GetUsuarioByUsernameAsync) => Task.FromResult<Usuario?>(user),
        nameof(IUsuarioRepository.UpdateUltimoAccesoAsync) => UpdateAccess(),
        _ => throw new InvalidOperationException(method)
    });
    Task<bool> UpdateAccess() { updates++; return Task.FromResult(true); }
    var config = Configuration();
    var service = new AuthService(repository, config);
    var response = await service.LoginAsync(new LoginRequestDto { Username = "tester", Password = "valid-password" });
    var principal = new JwtSecurityTokenHandler { MapInboundClaims = false }.ValidateToken(response.Token,
        new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!)),
            ValidateIssuer = true, ValidIssuer = config["Jwt:Issuer"],
            ValidateAudience = true, ValidAudience = config["Jwt:Issuer"],
            ValidateLifetime = true, ClockSkew = TimeSpan.Zero
        }, out _);
    Check.That(principal.FindFirstValue("sub") == "7" && principal.FindFirstValue(ClaimTypes.Role) == "ADMIN", "Claims de identidad/rol");
    Check.That(!string.IsNullOrWhiteSpace(principal.FindFirstValue("jti")), "Identificador de sesión");
    Check.That(response.User.Id == 7 && updates == 1, "Respuesta y último acceso");
    Check.That(response.ExpiresAt > DateTime.UtcNow.AddHours(7), "Expiración");
    await Check.Throws<InvalidOperationException>(() => service.LoginAsync(new LoginRequestDto { Password = "incorrecta" }));
    user.Activo = false;
    await Check.Throws<InvalidOperationException>(() => service.LoginAsync(new LoginRequestDto { Password = "valid-password" }));
    Check.That(updates == 1, "Login rechazado no actualiza último acceso");
}

static async Task Users()
{
    Usuario? duplicate = new Usuario { Id = 1 };
    Usuario? saved = null;
    var repository = RepositoryStub.Create<IUsuarioRepository>((method, args) => method switch
    {
        nameof(IUsuarioRepository.GetUsuarioByUsernameAsync) => Task.FromResult(duplicate),
        nameof(IUsuarioRepository.CreateUsuarioAsync) => Task.FromResult(saved = (Usuario)args[0]!),
        _ => throw new InvalidOperationException(method)
    });
    var service = new UsuariosService(repository);
    var request = new CreateUsuarioRequestDto { Username = " nuevo ", Nombre = " Persona ", Rol = "consulta", Password = "safe-password" };
    await Check.Throws<InvalidOperationException>(() => service.CreateAsync(request));
    Check.That(saved is null, "No persistir username duplicado");
    duplicate = null;
    await service.CreateAsync(request);
    Check.That(saved is { Username: "nuevo", Nombre: "Persona", Rol: "CONSULTA" }, "Normalización del usuario");
    Check.That(PasswordHasher.Verify(request.Password, saved!.PasswordHash) && saved.PasswordHash != request.Password, "Hash de contraseña");
}

static async Task Communities()
{
    object?[]? filters = null;
    Comunidad? saved = null;
    var repository = RepositoryStub.Create<IComunidadRepository>((method, args) => method switch
    {
        nameof(IComunidadRepository.GetComunidadesAsync) => GetAll(args),
        nameof(IComunidadRepository.CreateComunidadAsync) => Task.FromResult(saved = (Comunidad)args[0]!),
        nameof(IComunidadRepository.UpdateComunidadAsync) => Task.FromResult<Comunidad?>(null),
        _ => throw new InvalidOperationException(method)
    });
    Task<List<Comunidad>> GetAll(object?[] args) { filters = args; return Task.FromResult(new List<Comunidad>()); }
    var service = new ComunidadService(repository);
    await service.GetAllAsync("zona", true, "municipio", "departamento");
    Check.That(filters!.SequenceEqual(new object?[] { "zona", true, "municipio", "departamento" }), "Filtros de comunidad");
    var response = await service.CreateAsync(new CreateComunidadRequestDto
        { Nombre = " Zona ", Municipio = " M ", Departamento = " D ", Pais = " Guatemala ", Latitud = 14.5m });
    Check.That(saved is { Nombre: "Zona", Municipio: "M", Departamento: "D", Pais: "Guatemala" } && response.Latitud == 14.5m, "Normalización y coordenadas");
    Check.That(await service.UpdateAsync(999, new UpdateComunidadRequestDto()) is null, "Comunidad inexistente");
}

static async Task Sensors()
{
    var timestamp = DateTime.UtcNow.AddMinutes(-3);
    var sensor = new Sensor { Id = 8, Activo = false, ValorActual = 27m, UltimaLectura = timestamp };
    Sensor? saved = null;
    var repository = RepositoryStub.Create<ISensorRepository>((method, args) => method switch
    {
        nameof(ISensorRepository.GetSensorByIdAsync) => Task.FromResult((int)args[0]! == 8 ? sensor : null),
        nameof(ISensorRepository.UpdateSensorAsync) => Task.FromResult<Sensor?>(saved = (Sensor)args[1]!),
        _ => throw new InvalidOperationException(method)
    });
    var service = new SensoresService(repository);
    var request = new UpdateSensorRequestDto { Nombre = "Nuevo", Codigo = "S-8", Tipo = "TEMPERATURA",
        Unidad = "C", ComunidadId = 3, Latitud = 14m, Longitud = -90m, Descripcion = "Ubicación", FechaInstalacion = timestamp };
    var response = await service.UpdateAsync(8, request);
    Check.That(saved is { Codigo: "S-8", ComunidadId: 3, Latitud: 14m, Longitud: -90m, Descripcion: "Ubicación" }, "Metadatos completos");
    Check.That(response is { Activo: false, ValorActual: 27m } && response.UltimaLectura == timestamp, "No sobrescribir estado omitido ni lectura");
    Check.That(await service.UpdateAsync(999, request) is null, "Sensor inexistente");
}

static async Task InvalidReadings()
{
    Sensor? sensor = null;
    var sensors = RepositoryStub.Create<ISensorRepository>((method, args) => method switch
    {
        nameof(ISensorRepository.GetSensorByIdAsync) => Task.FromResult(sensor),
        _ => throw new Exception("No debe persistir una lectura inválida")
    });
    var alerts = RepositoryStub.Create<IAlertaRepository>((method, args) => method switch
    {
        nameof(IAlertaRepository.GetConfiguracionAlertasAsync) => Task.FromResult(new List<ConfiguracionAlerta>()),
        _ => throw new Exception("Operación inesperada de alertas")
    });
    var evaluation = RepositoryStub.Create<IAlertEvaluationService>((method, args) => throw new Exception("No evaluar lectura inválida"));
    var service = new LecturasService(sensors, alerts, evaluation, new RecordingHub());
    var request = new CreateLecturaRequestDto { SensorId = 1, Valor = 20m };
    await Check.Throws<KeyNotFoundException>(() => service.CreateAsync(request));
    sensor = new Sensor { Id = 1, Activo = false };
    await Check.Throws<InvalidOperationException>(() => service.CreateAsync(request));
    sensor.Activo = true;
    await Check.Throws<InvalidOperationException>(() => service.CreateAsync(request));
}

static async Task ValidReading()
{
    var sensor = new Sensor { Id = 4, Nombre = "Viento", ComunidadId = 2, Unidad = "km/h", Tipo = "VIENTO", Activo = true };
    var sensors = RepositoryStub.Create<ISensorRepository>((method, args) => method switch
    {
        nameof(ISensorRepository.GetSensorByIdAsync) => Task.FromResult<Sensor?>(sensor),
        nameof(ISensorRepository.CreateLecturaAsync) => Save((LecturaSensor)args[0]!),
        _ => throw new InvalidOperationException(method)
    });
    Task<LecturaSensor> Save(LecturaSensor reading) { reading.Id = 11; reading.Sensor = sensor; return Task.FromResult(reading); }
    var alerts = RepositoryStub.Create<IAlertaRepository>((method, args) => method switch
    {
        nameof(IAlertaRepository.GetConfiguracionAlertasAsync) => Task.FromResult(new List<ConfiguracionAlerta> { new() { Activo = true } }),
        _ => throw new InvalidOperationException(method)
    });
    var evaluated = false;
    var evaluation = RepositoryStub.Create<IAlertEvaluationService>((method, args) =>
    {
        Check.That(ReferenceEquals(args[0], sensor) && (decimal)args[1]! == 45m, "Evaluación de la lectura persistida");
        evaluated = true;
        return Task.CompletedTask;
    });
    var hub = new RecordingHub();
    var response = await new LecturasService(sensors, alerts, evaluation, hub).CreateAsync(
        new CreateLecturaRequestDto { SensorId = 4, Valor = 45m });
    Check.That(evaluated && response is { Id: 11, SensorId: 4, Valor: 45m, ComunidadId: 2, EstadoSensor: "ACTIVO" }, "Respuesta de lectura");
    Check.That(hub.Events.Single().Method == "lecturaActualizada", "Evento de lectura");
}

static async Task Alerts()
{
    Alerta? savedAlert = null;
    HistorialEvento? savedEvent = null;
    var audit = new List<Bitacora>();
    var rules = new List<ConfiguracionAlerta>
    {
        new() { Id = 1, Activo = true, ValorMinimo = 40m, Nivel = "AMARILLO", Fenomeno = "TORMENTA" },
        new() { Id = 2, Activo = true, ValorMinimo = 60m, ValorMaximo = 80m, Nivel = "NARANJA", Fenomeno = "TORMENTA", Mensaje = "Viento alto" },
        new() { Id = 3, Activo = false, ValorMinimo = 60m, Nivel = "ROJO" }
    };
    var repository = RepositoryStub.Create<IAlertaRepository>((method, args) => method switch
    {
        nameof(IAlertaRepository.GetConfiguracionAlertasAsync) => Task.FromResult(rules),
        nameof(IAlertaRepository.CreateAlertaAsync) => SaveAlert((Alerta)args[0]!),
        nameof(IAlertaRepository.CreateHistorialEventoAsync) => Task.FromResult(savedEvent = (HistorialEvento)args[0]!),
        _ => throw new InvalidOperationException(method)
    });
    Task<Alerta> SaveAlert(Alerta alert) { alert.Id = 17; savedAlert = alert; return Task.FromResult(alert); }
    var auditRepository = RepositoryStub.Create<IAuditRepository>((method, args) =>
    {
        var entry = (Bitacora)args[0]!;
        audit.Add(entry);
        return Task.FromResult(entry);
    });
    var rule = new ClimateAlertRule(repository);
    var sensor = new Sensor { Id = 5, Tipo = "VIENTO", Unidad = "km/h", Nombre = "Viento" };
    Check.That((await rule.EvaluateAsync(sensor, 60m))?.ConfiguracionAlertaId == 2, "Límite inferior inclusivo");
    Check.That((await rule.EvaluateAsync(sensor, 80m))?.ConfiguracionAlertaId == 2, "Límite superior inclusivo");
    Check.That(await rule.EvaluateAsync(sensor, 39m) is null, "Sin umbral aplicable");
    var hub = new RecordingHub();
    await new AlertEvaluationService(repository, auditRepository, new[] { rule }, hub).EvaluateAndRegisterAsync(sensor, 60m);
    Check.That(savedAlert is { SensorId: 5, ConfiguracionAlertaId: 2, Nivel: "NARANJA", ValorDetectado: 60m, ValorMinimo: 60m, ValorMaximo: 80m }, "Alerta y umbrales");
    Check.That(savedEvent is { AlertaId: 17, SensorId: 5, Fenomeno: "TORMENTA" }, "Vínculo del historial");
    Check.That(audit.Count == 2 && hub.Events.Single().Method == "alertaGenerada", "Auditoría y notificación");
    await new AlertEvaluationService(repository, auditRepository, new[] { rule }, hub).EvaluateAndRegisterAsync(sensor, 39m);
    Check.That(audit.Count == 2 && hub.Events.Count == 1, "Sin efectos cuando no hay alerta");
}

static async Task DashboardAndHistory()
{
    var filters = new DashboardFiltersDto { ComunidadId = 3, Desde = DateTime.UtcNow.AddDays(-1) };
    var repository = RepositoryStub.Create<IDashboardRepository>((method, args) =>
    {
        Check.That(ReferenceEquals(filters, args[0]), "Filtros de dashboard");
        return method switch
        {
            nameof(IDashboardRepository.GetDashboardSnapshotAsync) => Task.FromResult(new DashboardSnapshot
                { Temperatura = 25m, SensoresActivos = 2, SensoresTotales = 3, AlertasActivas = 1, NivelGeneral = "NARANJA" }),
            nameof(IDashboardRepository.GetDashboardSeriesAsync) => Task.FromResult(new List<DashboardSeriesDto> { new() { Valor = 25m } }),
            _ => throw new InvalidOperationException(method)
        };
    });
    var service = new DashboardService(repository);
    var response = await service.GetAsync(filters);
    Check.That(response.Temperatura.Valor == 25m && response.SensoresTotales == 3 && response.NivelGeneral == "NARANJA", "Métricas del dashboard");
    Check.That((await service.GetSeriesAsync(filters)).Single().Valor == 25m, "Series");
    var historyFilters = new HistorialFiltersDto { ComunidadId = 3, Fenomeno = "TORMENTA" };
    var alerts = RepositoryStub.Create<IAlertaRepository>((method, args) =>
    {
        Check.That(ReferenceEquals(historyFilters, args[0]), "Filtros de historial");
        return Task.FromResult(new List<HistorialDto>
        {
            new() { Nivel = "NARANJA", Fenomeno = "TORMENTA" },
            new() { Nivel = "NARANJA", Fenomeno = "TORMENTA" }
        });
    });
    var statistics = await new HistorialService(alerts).GetStatisticsAsync(historyFilters);
    Check.That(statistics.TotalEventos == 2 && statistics.PorNivel["NARANJA"] == 2 && statistics.PorFenomeno["TORMENTA"] == 2, "Agrupaciones de historial");
}

public class RepositoryStub : DispatchProxy
{
    private Func<string, object?[], object?> _handler = null!;

    public static T Create<T>(Func<string, object?[], object?> handler) where T : class
    {
        var proxy = DispatchProxy.Create<T, RepositoryStub>();
        ((RepositoryStub)(object)proxy)._handler = handler;
        return proxy;
    }

    protected override object? Invoke(MethodInfo? targetMethod, object?[]? args) =>
        _handler(targetMethod!.Name, args ?? []);
}

public sealed class RecordingHub : IHubContext<MonitoreoHub>, IClientProxy
{
    public List<(string Method, object?[] Arguments)> Events { get; } = [];
    public IHubClients Clients => RepositoryStub.Create<IHubClients>((method, args) =>
        method == "get_All" ? this : throw new NotSupportedException(method));
    public IGroupManager Groups => throw new NotSupportedException();

    public Task SendCoreAsync(string method, object?[] args, CancellationToken cancellationToken = default)
    {
        Events.Add((method, args));
        return Task.CompletedTask;
    }
}

public static class Check
{
    public static void That(bool condition, string message)
    {
        if (!condition) throw new Exception(message);
    }

    public static async Task Throws<T>(Func<Task> action) where T : Exception
    {
        try { await action(); }
        catch (T) { return; }
        throw new Exception($"Se esperaba {typeof(T).Name}");
    }
}
