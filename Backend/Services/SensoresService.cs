using WeatherRisk.Api.DTOs.Sensores;
using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class SensoresService : ISensoresService
{
    private readonly IWeatherRepository _repository;

    public SensoresService(IWeatherRepository repository) => _repository = repository;

    public async Task<List<SensorDto>> GetAllAsync() =>
        (await _repository.GetSensoresAsync()).Select(Map).ToList();

    public async Task<SensorDto?> GetByIdAsync(int id)
    {
        var sensor = await _repository.GetSensorByIdAsync(id);
        return sensor is null ? null : Map(sensor);
    }

    public async Task<SensorDto> CreateAsync(CreateSensorRequestDto request)
    {
        var sensor = await _repository.CreateSensorAsync(new Sensor
        {
            Nombre = request.Nombre,
            Tipo = request.Tipo,
            Unidad = request.Unidad,
            ComunidadId = request.ComunidadId,
            Activo = true,
            ValorActual = 0m
        });
        return Map(sensor);
    }

    public async Task<SensorDto?> UpdateAsync(int id, UpdateSensorRequestDto request)
    {
        var sensor = await _repository.GetSensorByIdAsync(id);
        if (sensor is null)
            return null;

        sensor.Nombre = request.Nombre;
        sensor.Tipo = request.Tipo;
        sensor.Unidad = request.Unidad;
        sensor.ComunidadId = request.ComunidadId;
        var updated = await _repository.UpdateSensorAsync(id, sensor);
        return updated is null ? null : Map(updated);
    }

    public Task<bool> DeleteAsync(int id) => _repository.DeleteSensorAsync(id);

    private static SensorDto Map(Sensor sensor) => new()
    {
        Id = sensor.Id,
        Nombre = sensor.Nombre,
        Tipo = sensor.Tipo,
        Unidad = sensor.Unidad,
        ValorActual = sensor.ValorActual,
        Activo = sensor.Activo,
        ComunidadId = sensor.ComunidadId,
        UltimaLectura = sensor.UltimaLectura
    };
}