using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class ClimateAlertRule : IAlertRule
{
    private readonly IWeatherRepository _repository;

    public ClimateAlertRule(IWeatherRepository repository)
    {
        _repository = repository;
    }

    public async Task<AlertDecision?> EvaluateAsync(Sensor sensor, decimal value)
    {
        var thresholds = await _repository.GetConfiguracionAlertasAsync(sensor.Tipo);
        var threshold = thresholds
            .Where(t => t.Activo && value >= t.ValorMinimo)
            .OrderByDescending(t => t.ValorMinimo)
            .FirstOrDefault();

        if (threshold is null)
            return null;

        return new AlertDecision(threshold.Nivel, threshold.Fenomeno, threshold.Mensaje);
    }
}