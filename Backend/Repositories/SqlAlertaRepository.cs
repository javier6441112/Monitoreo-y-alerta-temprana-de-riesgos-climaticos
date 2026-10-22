using Microsoft.EntityFrameworkCore;
using WeatherRisk.Api.Data;
using WeatherRisk.Api.DTOs.Historial;
using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Repositories;

public sealed class SqlAlertaRepository : IAlertaRepository
{
    private readonly WeatherDbContext _context;

    public SqlAlertaRepository(WeatherDbContext context) => _context = context;

    public async Task<List<Alerta>> GetAlertasAsync(bool? activas = null, DateTime? desde = null, DateTime? hasta = null, int? comunidadId = null, int? sensorId = null, string? fenomeno = null, string? nivel = null, string? estado = null)
    {
        var query = _context.Alertas.AsQueryable();
        if (activas.HasValue) query = query.Where(a => a.Activa == activas.Value);
        if (desde.HasValue) query = query.Where(a => a.FechaHora >= desde.Value);
        if (hasta.HasValue) query = query.Where(a => a.FechaHora <= hasta.Value);
        if (comunidadId.HasValue) query = query.Where(a => a.Sensor!.ComunidadId == comunidadId.Value);
        if (sensorId.HasValue) query = query.Where(a => a.SensorId == sensorId.Value);
        if (!string.IsNullOrWhiteSpace(fenomeno)) query = query.Where(a => a.Fenomeno.Contains(fenomeno));
        if (!string.IsNullOrWhiteSpace(nivel)) query = query.Where(a => a.Nivel == nivel);
        if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(a => a.Estado == estado);

        return await query
            .Include(a => a.Sensor).ThenInclude(sensor => sensor!.Comunidad)
            .Include(a => a.AtendidaPor)
            .Include(a => a.CerradaPor)
            .OrderByDescending(a => a.FechaHora)
            .ToListAsync();
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

        alerta.Estado = "CERRADA";
        alerta.Activa = false;
        alerta.FechaCierre = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return alerta;
    }

    public async Task<Alerta?> SetAlertaStateAsync(int id, string estado)
    {
        var alerta = await _context.Alertas.FirstOrDefaultAsync(a => a.Id == id);
        if (alerta is null) return null;
        alerta.Estado = estado;
        alerta.Activa = estado == "ACTIVA";
        if (estado == "ATENDIDA")
            alerta.FechaAtencion ??= DateTime.UtcNow;
        if (estado == "CERRADA")
            alerta.FechaCierre ??= DateTime.UtcNow;
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

    public async Task<List<ConfiguracionAlerta>> GetConfiguracionAlertasAsync(string? tipoSensor = null, bool? activo = null)
    {
        var query = _context.ConfiguracionAlertas.AsQueryable();
        if (!string.IsNullOrWhiteSpace(tipoSensor)) query = query.Where(a => a.TipoSensor == tipoSensor);
        if (activo.HasValue) query = query.Where(a => a.Activo == activo.Value);
        return await query.OrderByDescending(a => a.ValorMinimo).ToListAsync();
    }

    public async Task<ConfiguracionAlerta?> GetConfiguracionAlertaByIdAsync(int id) =>
        await _context.ConfiguracionAlertas.FirstOrDefaultAsync(a => a.Id == id);

    public async Task<ConfiguracionAlerta> CreateConfiguracionAlertaAsync(ConfiguracionAlerta config)
    {
        _context.ConfiguracionAlertas.Add(config);
        await _context.SaveChangesAsync();
        return config;
    }

    public async Task<ConfiguracionAlerta?> UpdateConfiguracionAlertaAsync(int id, ConfiguracionAlerta config)
    {
        var existing = await _context.ConfiguracionAlertas.FirstOrDefaultAsync(a => a.Id == id);
        if (existing is null)
            return null;

        existing.Nombre = config.Nombre;
        existing.TipoSensor = config.TipoSensor;
        existing.Nivel = config.Nivel;
        existing.ValorMinimo = config.ValorMinimo;
        existing.ValorMaximo = config.ValorMaximo;
        existing.Fenomeno = config.Fenomeno;
        existing.Mensaje = config.Mensaje;
        existing.Activo = config.Activo;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<ConfiguracionAlerta?> SetConfiguracionAlertaStateAsync(int id, bool activo)
    {
        var config = await _context.ConfiguracionAlertas.FirstOrDefaultAsync(a => a.Id == id);
        if (config is null) return null;
        config.Activo = activo;
        await _context.SaveChangesAsync();
        return config;
    }

    public async Task<bool> DeleteConfiguracionAlertaAsync(int id)
    {
        var config = await _context.ConfiguracionAlertas.FirstOrDefaultAsync(a => a.Id == id);
        if (config is null)
            return false;

        _context.ConfiguracionAlertas.Remove(config);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<HistorialDto>> GetFilteredHistorialAsync(HistorialFiltersDto filters)
    {
        var query = _context.HistorialEventos
            .Join(_context.Sensores,
                evento => evento.SensorId,
                sensor => sensor.Id,
                (evento, sensor) => new HistorialDto
                {
                    Id = evento.Id,
                    FechaHora = evento.FechaHora,
                    ComunidadId = sensor.ComunidadId,
                    SensorId = evento.SensorId,
                    SensorNombre = sensor.Nombre,
                    AlertaId = evento.AlertaId,
                    Fenomeno = evento.Fenomeno,
                    Nivel = evento.Nivel,
                    Valor = null,
                    Mensaje = evento.Mensaje,
                    Estado = "ACTIVA",
                    ResponsableId = null,
                    ResponsableNombre = string.Empty
                });

        if (filters.Desde.HasValue) query = query.Where(h => h.FechaHora >= filters.Desde.Value);
        if (filters.Hasta.HasValue) query = query.Where(h => h.FechaHora <= filters.Hasta.Value);
        if (filters.ComunidadId.HasValue) query = query.Where(h => h.ComunidadId == filters.ComunidadId.Value);
        if (filters.SensorId.HasValue) query = query.Where(h => h.SensorId == filters.SensorId.Value);
        if (!string.IsNullOrWhiteSpace(filters.Fenomeno)) query = query.Where(h => h.Fenomeno == filters.Fenomeno);
        if (!string.IsNullOrWhiteSpace(filters.Nivel)) query = query.Where(h => h.Nivel == filters.Nivel);

        return await query.OrderByDescending(h => h.FechaHora).ToListAsync();
    }
}
