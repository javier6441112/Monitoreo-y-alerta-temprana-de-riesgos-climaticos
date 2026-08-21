using Microsoft.EntityFrameworkCore;
using WeatherRisk.Api.Data;
using WeatherRisk.Api.Repositories;
using WeatherRisk.Api.Services;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=localhost,1433;Database=ClimateRiskDb;User Id=sa;Password=ChangeThis_StrongPassword123!;TrustServerCertificate=True;Encrypt=False";

builder.Services.AddDbContext<WeatherDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<IWeatherRepository, SqlWeatherRepository>();
builder.Services.AddScoped<IWeatherService, WeatherService>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "WeatherRisk API V1");
    c.RoutePrefix = "swagger";
});

app.MapControllers();

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    service = "weather-risk-api",
    utc = DateTimeOffset.UtcNow
}));

app.MapGet("/", () => Results.Ok(new
{
    name = "Sistema de Monitoreo y Alerta Temprana",
    status = "running"
}));

app.Run();
