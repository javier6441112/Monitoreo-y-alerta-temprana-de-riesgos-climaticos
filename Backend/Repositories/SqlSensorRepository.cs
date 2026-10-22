using Microsoft.EntityFrameworkCore;
using WeatherRisk.Api.Data;
using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Repositories;

public sealed class SqlSensorRepository : ISensorRepository
{
    private readonly WeatherDbContext _context;

    public SqlSensorRepository(WeatherDbContext context) => _context = context;

    public async Task<List<Sensor>> GetSensoresAsync() => await _context.Sensores.OrderBy(s => s.Id).ToListAsync();

    public async Task<Sensor?> GetSensorByIdAsync(int id) => await _context.Sensores.FirstOrDefaultAsync(s => s.Id == id);

    public async Task<Sensor> CreateSensorAsync(Sensor sensor)
    {
        _context.Sensores.Add(sensor);
        await _context.SaveChangesAsync();
        return sensor;
    }

    public async Task<Sensor?> UpdateSensorAsync(int id, Sensor sensor)
    {
        var existing = await _context.Sensores.FirstOrDefaultAsync(s => s.Id == id);
        if (existing is null)
            return null;

        existing.Codigo = sensor.Codigo;
        existing.Latitud = sensor.Latitud;
        existing.Longitud = sensor.Longitud;
        existing.FechaInstalacion = sensor.FechaInstalacion;
        existing.Descripcion = sensor.Descripcion;
        existing.Nombre = sensor.Nombre;
        existing.Tipo = sensor.Tipo;
        existing.Unidad = sensor.Unidad;
        existing.ComunidadId = sensor.ComunidadId;
        existing.Activo = sensor.Activo;
        existing.ValorActual = sensor.ValorActual;
        existing.UltimaLectura = sensor.UltimaLectura;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteSensorAsync(int id)
    {
        var sensor = await _context.Sensores.FirstOrDefaultAsync(s => s.Id == id);
        if (sensor is null)
            return false;

        _context.Sensores.Remove(sensor);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<LecturaSensor>> GetLecturasAsync(int? sensorId = null, DateTime? desde = null, DateTime? hasta = null, int? comunidadId = null)
    {
        var query = _context.LecturasSensores
            .Include(l => l.Sensor)
            .AsQueryable();

        if (sensorId.HasValue)
            query = query.Where(l => l.SensorId == sensorId.Value);

        if (comunidadId.HasValue)
            query = query.Where(l => l.Sensor!.ComunidadId == comunidadId.Value);

        if (desde.HasValue)
            query = query.Where(l => l.FechaHora >= desde.Value);

        if (hasta.HasValue)
            query = query.Where(l => l.FechaHora <= hasta.Value);

        return await query.OrderByDescending(l => l.FechaHora).ToListAsync();
    }

    public async Task<LecturaSensor> CreateLecturaAsync(LecturaSensor lectura)
    {
        _context.LecturasSensores.Add(lectura);
        await _context.SaveChangesAsync();

        var sensor = await _context.Sensores.FirstOrDefaultAsync(s => s.Id == lectura.SensorId);
        if (sensor is not null)
        {
            sensor.ValorActual = lectura.Valor;
            sensor.UltimaLectura = lectura.FechaHora;
            await _context.SaveChangesAsync();
        }

        return lectura;
    }

    public async Task<List<Sensor>> GetSensoresActivosAsync() =>
        await _context.Sensores.Where(s => s.Activo).ToListAsync();

    public async Task<List<Sensor>> GetFilteredSensoresAsync(string? codigo, string? tipo, bool? activo, int? comunidadId, string? buscar)
    {
        var query = _context.Sensores.Include(s => s.Comunidad).AsQueryable();
        if (!string.IsNullOrWhiteSpace(codigo)) query = query.Where(s => s.Codigo.Contains(codigo));
        if (!string.IsNullOrWhiteSpace(tipo)) query = query.Where(s => s.Tipo == tipo);
        if (activo.HasValue) query = query.Where(s => s.Activo == activo.Value);
        if (comunidadId.HasValue) query = query.Where(s => s.ComunidadId == comunidadId.Value);
        if (!string.IsNullOrWhiteSpace(buscar)) query = query.Where(s => s.Nombre.Contains(buscar) || s.Codigo.Contains(buscar));
        return await query.OrderBy(s => s.Id).ToListAsync();
    }

    public async Task<bool> SetSensorActivoAsync(int id, bool activo)
    {
        var sensor = await _context.Sensores.FirstOrDefaultAsync(s => s.Id == id);
        if (sensor is null) return false;
        sensor.Activo = activo;
        await _context.SaveChangesAsync();
        return true;
    }
}
