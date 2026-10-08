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
            .Where(t => t.Activo && (!t.ValorMinimo.HasValue || t.ValorMinimo.Value <= value) && (!t.ValorMaximo.HasValue || value <= t.ValorMaximo.Value))
            .OrderByDescending(t => t.ValorMinimo ?? decimal.MinValue)
            .FirstOrDefault();

        if (threshold is null)
            return null;

        return new AlertDecision(threshold.Id, threshold.Nivel, threshold.Fenomeno, threshold.Mensaje, threshold.ValorMinimo, threshold.ValorMaximo);
    }
}