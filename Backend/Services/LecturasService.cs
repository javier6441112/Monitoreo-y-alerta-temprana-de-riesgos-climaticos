using Microsoft.AspNetCore.SignalR;
using WeatherRisk.Api.Hubs;
using WeatherRisk.Api.DTOs.Lecturas;
using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class LecturasService : ILecturasService
{
    private readonly IWeatherRepository _repository;
    private readonly IAlertEvaluationService _alertEvaluation;
    private readonly IHubContext<MonitoreoHub> _hubContext;

    public LecturasService(
        IWeatherRepository repository,
        IAlertEvaluationService alertEvaluation,
        IHubContext<MonitoreoHub> hubContext)
    {
        _repository = repository;
        _alertEvaluation = alertEvaluation;
        _hubContext = hubContext;
    }

    public async Task<List<LecturaDto>> GetAllAsync(int? sensorId, int? comunidadId, DateTime? desde, DateTime? hasta) =>
        (await _repository.GetLecturasAsync(sensorId, desde, hasta, comunidadId))
            .Select(Map)
            .ToList();

    public async Task<LecturaDto> CreateAsync(CreateLecturaRequestDto request)
    {
        var sensor = await _repository.GetSensorByIdAsync(request.SensorId);
        if (sensor is null)
            throw new KeyNotFoundException("Sensor no encontrado.");
        if (!sensor.Activo)
            throw new InvalidOperationException("No se pueden registrar lecturas para un sensor inactivo.");
        if (!(await _repository.GetConfiguracionAlertasAsync(sensor.Tipo, activo: true)).Any())
            throw new InvalidOperationException("No hay reglas de alerta activas para el tipo de este sensor.");

        var lectura = await _repository.CreateLecturaAsync(new LecturaSensor
        {
            SensorId = request.SensorId,
            Valor = request.Valor,
            FechaHora = DateTime.UtcNow
        });

        await _alertEvaluation.EvaluateAndRegisterAsync(sensor, lectura.Valor);
        await _hubContext.Clients.All.SendAsync("lecturaActualizada", new
        {
            sensorId = lectura.SensorId,
            valor = lectura.Valor,
            fechaHora = lectura.FechaHora
        });
        return Map(lectura);
    }

    private static LecturaDto Map(LecturaSensor lectura) => new()
    {
        Id = lectura.Id,
        SensorId = lectura.SensorId,
        SensorNombre = lectura.Sensor?.Nombre ?? string.Empty,
        ComunidadId = lectura.Sensor?.ComunidadId ?? 0,
        FechaHora = lectura.FechaHora,
        Valor = lectura.Valor,
        Unidad = lectura.Sensor?.Unidad ?? string.Empty,
        EstadoSensor = lectura.Sensor?.Activo == true ? "ACTIVO" : "INACTIVO"
    };
}