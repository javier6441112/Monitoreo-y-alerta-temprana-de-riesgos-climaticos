using Microsoft.EntityFrameworkCore;
using WeatherRisk.Api.Data;
using WeatherRisk.Api.DTOs.Bitacora;
using WeatherRisk.Api.DTOs.Dashboard;
using WeatherRisk.Api.DTOs.Historial;
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

    public async Task<Usuario?> GetUsuarioByIdAsync(int id) =>
        await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);

    public async Task<Usuario?> GetUsuarioByUsernameAsync(string username) =>
        await _context.Usuarios.FirstOrDefaultAsync(u => u.Username == username);

    public async Task<Usuario> CreateUsuarioAsync(Usuario usuario)
    {
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();
        return usuario;
    }

    public async Task<Usuario?> UpdateUsuarioAsync(int id, Usuario usuario)
    {
        var existing = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (existing is null)
            return null;

        existing.Username = usuario.Username;
        existing.Nombre = usuario.Nombre;
        existing.Rol = usuario.Rol;
        existing.Activo = usuario.Activo;
        if (!string.IsNullOrWhiteSpace(usuario.PasswordHash))
            existing.PasswordHash = usuario.PasswordHash;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> UpdateUltimoAccesoAsync(int usuarioId, DateTime ultimoAcceso)
    {
        var usuario = await _context.Usuarios.FindAsync(usuarioId);
        if (usuario is null)
            return false;

        usuario.UltimoAcceso = ultimoAcceso;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<Usuario?> SetUsuarioActivoAsync(int id, bool activo)
    {
        var existing = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (existing is null)
            return null;

        existing.Activo = activo;
        await _context.SaveChangesAsync();
        return existing;
    }

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

        return await query.Include(a => a.Sensor).OrderByDescending(a => a.FechaHora).ToListAsync();
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

    public async Task<Alerta?> SetAlertaStateAsync(int id, string estado)
    {
        var alerta = await _context.Alertas.FirstOrDefaultAsync(a => a.Id == id);
        if (alerta is null) return null;
        alerta.Estado = estado;
        alerta.Activa = estado == "ACTIVA";
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

    public async Task<List<Bitacora>> GetBitacoraAsync(DateTime? desde = null, DateTime? hasta = null, int? usuarioId = null, string? accion = null, string? entidad = null)
    {
        var query = _context.Bitacora.AsQueryable();
        if (desde.HasValue) query = query.Where(b => b.FechaHora >= desde.Value);
        if (hasta.HasValue) query = query.Where(b => b.FechaHora <= hasta.Value);
        if (usuarioId.HasValue) query = query.Where(b => b.UsuarioId == usuarioId.Value);
        if (!string.IsNullOrWhiteSpace(accion)) query = query.Where(b => b.Accion.Contains(accion));
        if (!string.IsNullOrWhiteSpace(entidad)) query = query.Where(b => b.Descripcion.Contains(entidad));
        return await query.OrderByDescending(b => b.FechaHora).ToListAsync();
    }

    public async Task<Bitacora> CreateBitacoraAsync(Bitacora bitacora)
    {
        _context.Bitacora.Add(bitacora);
        await _context.SaveChangesAsync();
        return bitacora;
    }

    public async Task<List<Sensor>> GetSensoresActivosAsync() =>
        await _context.Sensores.Where(s => s.Activo).ToListAsync();

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

        existing.TipoSensor = config.TipoSensor;
        existing.Nivel = config.Nivel;
        existing.ValorMinimo = config.ValorMinimo;
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

    public async Task<DashboardSnapshot> GetDashboardSnapshotAsync(DashboardFiltersDto filters)
    {
        var query = _context.Sensores.AsQueryable();
        if (filters.ComunidadId.HasValue) query = query.Where(s => s.ComunidadId == filters.ComunidadId.Value);
        if (filters.Desde.HasValue) query = query.Where(s => s.UltimaLectura >= filters.Desde.Value);
        if (filters.Hasta.HasValue) query = query.Where(s => s.UltimaLectura <= filters.Hasta.Value);

        var sensores = await query.ToListAsync();
        var alertas = await _context.Alertas
            .Include(a => a.Sensor)
            .Where(a => a.Activa && (filters.ComunidadId == null || a.Sensor != null && a.Sensor.ComunidadId == filters.ComunidadId.Value))
            .ToListAsync();

        var temperatura = sensores.FirstOrDefault(s => s.Tipo == "TEMPERATURA")?.ValorActual ?? 0m;
        var humedad = sensores.FirstOrDefault(s => s.Tipo == "HUMEDAD")?.ValorActual ?? 0m;
        var viento = sensores.FirstOrDefault(s => s.Tipo == "VIENTO")?.ValorActual ?? 0m;
        var lluvia = sensores.FirstOrDefault(s => s.Tipo == "LLUVIA")?.ValorActual ?? 0m;
        var nivelRio = sensores.FirstOrDefault(s => s.Tipo == "NIVEL_RIO")?.ValorActual ?? 0m;

        var snapshot = new DashboardSnapshot
        {
            Temperatura = temperatura, Humedad = humedad, Viento = viento, Lluvia = lluvia,
            NivelRio = nivelRio, AlertasActivas = alertas.Count,
            SensoresActivos = sensores.Count(s => s.Activo), SensoresTotales = sensores.Count,
            NivelGeneral = "VERDE"
        };
        if (nivelRio >= 3.5m) snapshot.NivelGeneral = "NARANJA";
        if (nivelRio > 4.5m) snapshot.NivelGeneral = "ROJO";
        if (viento >= 40m && viento < 60m) snapshot.NivelGeneral = "AMARILLO";
        return snapshot;
    }

    public async Task<List<DashboardSeriesDto>> GetDashboardSeriesAsync(DashboardFiltersDto filters)
    {
        var query = _context.LecturasSensores.AsQueryable();
        if (filters.ComunidadId.HasValue) query = query.Where(l => l.Sensor!.ComunidadId == filters.ComunidadId.Value);
        if (filters.Desde.HasValue) query = query.Where(l => l.FechaHora >= filters.Desde.Value);
        if (filters.Hasta.HasValue) query = query.Where(l => l.FechaHora <= filters.Hasta.Value);
        return await query.OrderBy(l => l.FechaHora).Select(l => new DashboardSeriesDto { FechaHora = l.FechaHora, Valor = l.Valor }).ToListAsync();
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
