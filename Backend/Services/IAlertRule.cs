using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Services;

public sealed record AlertDecision(string Nivel, string Fenomeno, string Mensaje);

public interface IAlertRule
{
    AlertDecision? Evaluate(Sensor sensor, decimal value);
}