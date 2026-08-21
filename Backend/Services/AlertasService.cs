using WeatherRisk.Api.DTOs.Alertas;
using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class AlertasService : IAlertasService
{
    private readonly IWeatherRepository _repository;

    public AlertasService(IWeatherRepository repository) => _repository = repository;

    public async Task<List<AlertaDto>> GetAllAsync(bool? activas) =>
        (await _repository.GetAlertasAsync(activas)).Select(Map).ToList();

    public async Task<AlertaDto?> CloseAsync(int id)
    {
        var alerta = await _repository.CerrarAlertaAsync(id);
        return alerta is null ? null : Map(alerta);
    }

    private static AlertaDto Map(Alerta alerta) => new()
    {
        Id = alerta.Id,
        Nivel = alerta.Nivel,
        Fenomeno = alerta.Fenomeno,
        Mensaje = alerta.Mensaje,
        SensorId = alerta.SensorId,
        ValorDetectado = alerta.ValorDetectado,
        FechaHora = alerta.FechaHora,
        Activa = alerta.Activa
    };
}