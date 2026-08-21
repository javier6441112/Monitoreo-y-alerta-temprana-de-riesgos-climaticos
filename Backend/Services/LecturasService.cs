using WeatherRisk.Api.DTOs.Lecturas;
using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class LecturasService : ILecturasService
{
    private readonly IWeatherRepository _repository;
    private readonly IAlertEvaluationService _alertEvaluation;

    public LecturasService(IWeatherRepository repository, IAlertEvaluationService alertEvaluation)
    {
        _repository = repository;
        _alertEvaluation = alertEvaluation;
    }

    public async Task<List<LecturaDto>> GetAllAsync(int? sensorId, DateTime? fechaInicio, DateTime? fechaFin) =>
        (await _repository.GetLecturasAsync(sensorId, fechaInicio, fechaFin))
            .Select(Map)
            .ToList();

    public async Task<LecturaDto> CreateAsync(CreateLecturaRequestDto request)
    {
        var sensor = await _repository.GetSensorByIdAsync(request.SensorId);
        if (sensor is null)
            throw new KeyNotFoundException("Sensor no encontrado.");

        var lectura = await _repository.CreateLecturaAsync(new LecturaSensor
        {
            SensorId = request.SensorId,
            Valor = request.Valor,
            FechaHora = DateTime.UtcNow
        });

        await _alertEvaluation.EvaluateAndRegisterAsync(sensor, lectura.Valor);
        return Map(lectura);
    }

    private static LecturaDto Map(LecturaSensor lectura) => new()
    {
        Id = lectura.Id,
        SensorId = lectura.SensorId,
        Valor = lectura.Valor,
        FechaHora = lectura.FechaHora
    };
}