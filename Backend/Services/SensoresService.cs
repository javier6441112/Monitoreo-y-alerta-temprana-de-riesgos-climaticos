using WeatherRisk.Api.DTOs.Sensores;
using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class SensoresService : ISensoresService
{
    private readonly ISensorRepository _repository;

    public SensoresService(ISensorRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<SensorDto>> GetAllAsync(string? codigo, string? tipo, bool? activo, int? comunidadId, string? buscar)
    {
        var sensores = await _repository.GetFilteredSensoresAsync(codigo, tipo, activo, comunidadId, buscar);
        return sensores.Select(Map).ToList();
    }

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
            Codigo = request.Codigo,
            Tipo = request.Tipo,
            Unidad = request.Unidad,
            ComunidadId = request.ComunidadId,
            Latitud = request.Latitud,
            Longitud = request.Longitud,
            Activo = request.Activo,
            FechaInstalacion = request.FechaInstalacion ?? DateTime.UtcNow,
            Descripcion = request.Descripcion,
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
        sensor.Codigo = request.Codigo;
        sensor.Unidad = request.Unidad;
        sensor.ComunidadId = request.ComunidadId;
        sensor.Latitud = request.Latitud;
        sensor.Longitud = request.Longitud;
        sensor.FechaInstalacion = request.FechaInstalacion;
        sensor.Descripcion = request.Descripcion;
        if (request.Activo.HasValue)
            sensor.Activo = request.Activo.Value;
        var updated = await _repository.UpdateSensorAsync(id, sensor);
        return updated is null ? null : Map(updated);
    }

    public Task<bool> UpdateStateAsync(int id, bool activo) =>
        _repository.SetSensorActivoAsync(id, activo);

    public Task<bool> DeleteAsync(int id) => _repository.DeleteSensorAsync(id);

    private static SensorDto Map(Sensor sensor) => new()
    {
        Id = sensor.Id,
        Nombre = sensor.Nombre,
        Codigo = sensor.Codigo,
        Tipo = sensor.Tipo,
        Unidad = sensor.Unidad,
        ComunidadId = sensor.ComunidadId,
        ComunidadNombre = sensor.Comunidad?.Nombre,
        Latitud = sensor.Latitud,
        Longitud = sensor.Longitud,
        Activo = sensor.Activo,
        FechaInstalacion = sensor.FechaInstalacion,
        Descripcion = sensor.Descripcion,
        ValorActual = sensor.ValorActual,
        UltimaLectura = sensor.UltimaLectura
    };
}
