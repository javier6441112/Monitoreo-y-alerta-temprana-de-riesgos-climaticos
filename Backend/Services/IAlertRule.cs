using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Services;

public sealed record AlertDecision(
    int ConfiguracionAlertaId,
    string Nivel,
    string Fenomeno,
    string Mensaje,
    decimal? ValorMinimo,
    decimal? ValorMaximo);

public interface IAlertRule
{
    Task<AlertDecision?> EvaluateAsync(Sensor sensor, decimal value);
}