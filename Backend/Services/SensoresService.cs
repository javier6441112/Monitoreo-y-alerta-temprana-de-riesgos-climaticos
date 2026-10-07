using Microsoft.EntityFrameworkCore;
using WeatherRisk.Api.Data;
using WeatherRisk.Api.DTOs.Sensores;
using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class SensoresService : ISensoresService
{
    private readonly IWeatherRepository _repository;
    private readonly WeatherDbContext _context;

    public SensoresService(IWeatherRepository repository, WeatherDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    public async Task<List<SensorDto>> GetAllAsync(string? codigo, string? tipo, bool? activo, int? comunidadId, string? buscar)
    {
        var query = _context.Sensores.Include(s => s.Comunidad).AsQueryable();
        if (!string.IsNullOrWhiteSpace(codigo)) query = query.Where(s => s.Codigo.Contains(codigo));
        if (!string.IsNullOrWhiteSpace(tipo)) query = query.Where(s => s.Tipo == tipo);
        if (activo.HasValue) query = query.Where(s => s.Activo == activo.Value);
        if (comunidadId.HasValue) query = query.Where(s => s.ComunidadId == comunidadId.Value);
        if (!string.IsNullOrWhiteSpace(buscar)) query = query.Where(s => s.Nombre.Contains(buscar) || s.Codigo.Contains(buscar));
        return await query.OrderBy(s => s.Id).Select(s => Map(s)).ToListAsync();
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
        var sensor = await _context.Sensores.FirstOrDefaultAsync(s => s.Id == id);
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
        await _context.SaveChangesAsync();
        return Map(sensor);
    }

    public async Task<bool> UpdateStateAsync(int id, bool activo)
    {
        var sensor = await _context.Sensores.FirstOrDefaultAsync(s => s.Id == id);
        if (sensor is null) return false;
        sensor.Activo = activo;
        await _context.SaveChangesAsync();
        return true;
    }

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