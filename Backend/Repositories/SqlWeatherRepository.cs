using Microsoft.EntityFrameworkCore;
using WeatherRisk.Api.Data;
using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Repositories;

public class SqlWeatherRepository : IWeatherRepository
{
    private readonly WeatherDbContext _context;

    public SqlWeatherRepository(WeatherDbContext context)
    {
        _context = context;
    }

    public async Task<List<Usuario>> GetUsuariosAsync() => await _context.Usuarios.ToListAsync();

    public async Task<Usuario?> GetUsuarioByUsernameAsync(string username) =>
        await _context.Usuarios.FirstOrDefaultAsync(u => u.Username == username);

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

    public async Task<List<LecturaSensor>> GetLecturasAsync(int? sensorId = null, DateTime? fechaInicio = null, DateTime? fechaFin = null)
    {
        var query = _context.LecturasSensores.AsQueryable();

        if (sensorId.HasValue)
            query = query.Where(l => l.SensorId == sensorId.Value);

        if (fechaInicio.HasValue)
            query = query.Where(l => l.FechaHora >= fechaInicio.Value);

        if (fechaFin.HasValue)
            query = query.Where(l => l.FechaHora <= fechaFin.Value);

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

    public async Task<List<Alerta>> GetAlertasAsync(bool? activas = null)
    {
        var query = _context.Alertas.AsQueryable();
        if (activas.HasValue)
            query = query.Where(a => a.Activa == activas.Value);

        return await query.OrderByDescending(a => a.FechaHora).ToListAsync();
    }

    public async Task<Alerta?> GetAlertaByIdAsync(int id) => await _context.Alertas.FirstOrDefaultAsync(a => a.Id == id);

    public async Task<Alerta> CreateAlertaAsync(Alerta alerta)
    {
        _context.Alertas.Add(alerta);
        await _context.SaveChangesAsync();
        return alerta;
    }

    public async Task<Alerta?> CerrarAlertaAsync(int id)
    {
        var alerta = await _context.Alertas.FirstOrDefaultAsync(a => a.Id == id);
        if (alerta is null)
            return null;

        alerta.Activa = false;
        await _context.SaveChangesAsync();
        return alerta;
    }

    public async Task<List<HistorialEvento>> GetHistorialAsync() =>
        await _context.HistorialEventos.OrderByDescending(h => h.FechaHora).ToListAsync();

    public async Task<HistorialEvento> CreateHistorialEventoAsync(HistorialEvento evento)
    {
        _context.HistorialEventos.Add(evento);
        await _context.SaveChangesAsync();
        return evento;
    }

    public async Task<List<Bitacora>> GetBitacoraAsync() =>
        await _context.Bitacora.OrderByDescending(b => b.FechaHora).ToListAsync();

    public async Task<Bitacora> CreateBitacoraAsync(Bitacora bitacora)
    {
        _context.Bitacora.Add(bitacora);
        await _context.SaveChangesAsync();
        return bitacora;
    }

    public async Task<List<Sensor>> GetSensoresActivosAsync() =>
        await _context.Sensores.Where(s => s.Activo).ToListAsync();

    public async Task<DashboardSnapshot> GetDashboardSnapshotAsync()
    {
        var sensores = await _context.Sensores.ToListAsync();
        var alertas = await _context.Alertas.Where(a => a.Activa).ToListAsync();

        var temperatura = sensores.FirstOrDefault(s => s.Tipo == "TEMPERATURA")?.ValorActual ?? 0m;
        var humedad = sensores.FirstOrDefault(s => s.Tipo == "HUMEDAD")?.ValorActual ?? 0m;
        var viento = sensores.FirstOrDefault(s => s.Tipo == "VIENTO")?.ValorActual ?? 0m;
        var lluvia = sensores.FirstOrDefault(s => s.Tipo == "LLUVIA")?.ValorActual ?? 0m;
        var nivelRio = sensores.FirstOrDefault(s => s.Tipo == "NIVEL_RIO")?.ValorActual ?? 0m;

        var snapshot = new DashboardSnapshot
        {
            Temperatura = temperatura,
            Humedad = humedad,
            Viento = viento,
            Lluvia = lluvia,
            NivelRio = nivelRio,
            AlertasActivas = alertas.Count,
            SensoresActivos = sensores.Count(s => s.Activo),
            SensoresTotales = sensores.Count,
            NivelGeneral = "VERDE"
        };

        if (nivelRio >= 3.5m)
            snapshot.NivelGeneral = "NARANJA";

        if (nivelRio > 4.5m)
            snapshot.NivelGeneral = "ROJO";

        if (viento >= 40m && viento < 60m)
            snapshot.NivelGeneral = "AMARILLO";

        return snapshot;
    }
}
