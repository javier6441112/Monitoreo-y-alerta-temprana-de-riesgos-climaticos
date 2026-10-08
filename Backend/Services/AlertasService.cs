using WeatherRisk.Api.DTOs.Alertas;
using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class AlertasService : IAlertasService
{
    private readonly IWeatherRepository _repository;

    public AlertasService(IWeatherRepository repository) => _repository = repository;

    public async Task<List<AlertaDto>> GetAllAsync(bool? activas, DateTime? desde = null, DateTime? hasta = null, int? comunidadId = null, int? sensorId = null, string? fenomeno = null, string? nivel = null, string? estado = null) =>
        (await _repository.GetAlertasAsync(activas, desde, hasta, comunidadId, sensorId, fenomeno, nivel, estado)).Select(Map).ToList();

    public async Task<AlertaDto?> SetStateAsync(int id, string estado)
    {
        var alerta = await _repository.SetAlertaStateAsync(id, estado);
        return alerta is null ? null : Map(alerta);
    }

    public async Task<AlertaDto?> CloseAsync(int id)
    {
        var alerta = await _repository.CerrarAlertaAsync(id);
        return alerta is null ? null : Map(alerta);
    }

    private static AlertaDto Map(Alerta alerta) => new()
    {
        Id = alerta.Id,
        ComunidadId = alerta.Sensor?.ComunidadId ?? 0,
        ComunidadNombre = alerta.Sensor?.Comunidad?.Nombre ?? string.Empty,
        SensorId = alerta.SensorId,
        SensorNombre = alerta.Sensor?.Nombre ?? string.Empty,
        ConfiguracionAlertaId = alerta.ConfiguracionAlertaId,
        Nivel = alerta.Nivel,
        Fenomeno = alerta.Fenomeno,
        Mensaje = alerta.Mensaje,
        ValorDetectado = alerta.ValorDetectado,
        ValorMinimo = alerta.ValorMinimo,
        ValorMaximo = alerta.ValorMaximo,
        FechaHora = alerta.FechaHora,
        Estado = alerta.Estado,
        Activa = alerta.Activa,
        AtendidaPorId = alerta.AtendidaPorId,
        AtendidaPorNombre = alerta.AtendidaPor?.Nombre,
        FechaAtencion = alerta.FechaAtencion,
        CerradaPorId = alerta.CerradaPorId,
        CerradaPorNombre = alerta.CerradaPor?.Nombre,
        FechaCierre = alerta.FechaCierre
    };
}