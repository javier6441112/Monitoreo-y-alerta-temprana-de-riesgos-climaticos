using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Repositories;

public class WeatherRepository : IWeatherRepository
{
    private readonly List<Usuario> _usuarios;
    private readonly List<Sensor> _sensores;
    private readonly List<LecturaSensor> _lecturas;
    private readonly List<Alerta> _alertas;
    private readonly List<HistorialEvento> _historial;
    private readonly List<Bitacora> _bitacora;

    public WeatherRepository()
    {
        _usuarios = new List<Usuario>
        {
            new Usuario { Id = 1, Username = "admin", Nombre = "Administrador", Rol = "ADMIN", PasswordHash = "admin123" },
            new Usuario { Id = 2, Username = "operador", Nombre = "Operador", Rol = "OPERADOR", PasswordHash = "operador123" }
        };

        _sensores = new List<Sensor>
        {
            new Sensor { Id = 1, Nombre = "Sensor Temperatura 01", Tipo = "TEMPERATURA", Unidad = "°C", Activo = true, ComunidadId = 1, ValorActual = 27.5m, UltimaLectura = DateTime.UtcNow.AddMinutes(-5) },
            new Sensor { Id = 2, Nombre = "Sensor Humedad 01", Tipo = "HUMEDAD", Unidad = "%", Activo = true, ComunidadId = 1, ValorActual = 78m, UltimaLectura = DateTime.UtcNow.AddMinutes(-4) },
            new Sensor { Id = 3, Nombre = "Sensor Viento 01", Tipo = "VIENTO", Unidad = "km/h", Activo = true, ComunidadId = 1, ValorActual = 42m, UltimaLectura = DateTime.UtcNow.AddMinutes(-3) },
            new Sensor { Id = 4, Nombre = "Sensor Lluvia 01", Tipo = "LLUVIA", Unidad = "mm/h", Activo = true, ComunidadId = 1, ValorActual = 18.5m, UltimaLectura = DateTime.UtcNow.AddMinutes(-2) },
            new Sensor { Id = 5, Nombre = "Sensor Río 01", Tipo = "NIVEL_RIO", Unidad = "m", Activo = true, ComunidadId = 1, ValorActual = 2.8m, UltimaLectura = DateTime.UtcNow.AddMinutes(-1) }
        };

        _lecturas = new List<LecturaSensor>
        {
            new LecturaSensor { Id = 1, SensorId = 1, Valor = 27.5m, FechaHora = DateTime.UtcNow.AddMinutes(-10) },
            new LecturaSensor { Id = 2, SensorId = 2, Valor = 78m, FechaHora = DateTime.UtcNow.AddMinutes(-8) },
            new LecturaSensor { Id = 3, SensorId = 3, Valor = 42m, FechaHora = DateTime.UtcNow.AddMinutes(-7) },
            new LecturaSensor { Id = 4, SensorId = 4, Valor = 18.5m, FechaHora = DateTime.UtcNow.AddMinutes(-5) },
            new LecturaSensor { Id = 5, SensorId = 5, Valor = 2.8m, FechaHora = DateTime.UtcNow.AddMinutes(-4) }
        };

        _alertas = new List<Alerta>
        {
            new Alerta { Id = 1, SensorId = 5, Nivel = "AMARILLO", Fenomeno = "INUNDACION", Mensaje = "El nivel del río está elevado.", ValorDetectado = 2.8m, FechaHora = DateTime.UtcNow.AddMinutes(-2), Activa = true },
            new Alerta { Id = 2, SensorId = 3, Nivel = "AMARILLO", Fenomeno = "TORMENTA", Mensaje = "Velocidad del viento por encima del nivel normal.", ValorDetectado = 42m, FechaHora = DateTime.UtcNow.AddMinutes(-1), Activa = true }
        };

        _historial = new List<HistorialEvento>
        {
            new HistorialEvento { Id = 1, SensorId = 5, Fenomeno = "INUNDACION", Nivel = "AMARILLO", Mensaje = "Nivel del río elevado.", FechaHora = DateTime.UtcNow.AddMinutes(-5) },
            new HistorialEvento { Id = 2, SensorId = 3, Fenomeno = "TORMENTA", Nivel = "AMARILLO", Mensaje = "Viento moderadamente alto.", FechaHora = DateTime.UtcNow.AddMinutes(-4) }
        };

        _bitacora = new List<Bitacora>
        {
            new Bitacora { Id = 1, UsuarioId = 1, Usuario = "admin", Accion = "LOGIN", Descripcion = "Inicio de sesión del administrador.", FechaHora = DateTime.UtcNow.AddMinutes(-20) }
        };
    }

    public Task<List<Usuario>> GetUsuariosAsync() => Task.FromResult(_usuarios);

    public Task<Usuario?> GetUsuarioByUsernameAsync(string username) =>
        Task.FromResult(_usuarios.FirstOrDefault(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase)));

    public Task<List<Sensor>> GetSensoresAsync() => Task.FromResult(_sensores);

    public Task<Sensor?> GetSensorByIdAsync(int id) =>
        Task.FromResult(_sensores.FirstOrDefault(s => s.Id == id));

    public Task<Sensor> CreateSensorAsync(Sensor sensor)
    {
        sensor.Id = _sensores.Count > 0 ? _sensores.Max(s => s.Id) + 1 : 1;
        _sensores.Add(sensor);
        return Task.FromResult(sensor);
    }

    public Task<Sensor?> UpdateSensorAsync(int id, Sensor sensor)
    {
        var existing = _sensores.FirstOrDefault(s => s.Id == id);
        if (existing is null)
            return Task.FromResult<Sensor?>(null);

        existing.Nombre = sensor.Nombre;
        existing.Tipo = sensor.Tipo;
        existing.Unidad = sensor.Unidad;
        existing.ComunidadId = sensor.ComunidadId;
        existing.Activo = sensor.Activo;
        return Task.FromResult<Sensor?>(existing);
    }

    public Task<bool> DeleteSensorAsync(int id)
    {
        var sensor = _sensores.FirstOrDefault(s => s.Id == id);
        if (sensor is null)
            return Task.FromResult(false);

        _sensores.Remove(sensor);
        return Task.FromResult(true);
    }

    public Task<List<LecturaSensor>> GetLecturasAsync(int? sensorId = null, DateTime? fechaInicio = null, DateTime? fechaFin = null)
    {
        var result = _lecturas.AsEnumerable();

        if (sensorId.HasValue)
            result = result.Where(l => l.SensorId == sensorId.Value);

        if (fechaInicio.HasValue)
            result = result.Where(l => l.FechaHora >= fechaInicio.Value);

        if (fechaFin.HasValue)
            result = result.Where(l => l.FechaHora <= fechaFin.Value);

        return Task.FromResult(result.OrderByDescending(l => l.FechaHora).ToList());
    }

    public Task<LecturaSensor> CreateLecturaAsync(LecturaSensor lectura)
    {
        lectura.Id = _lecturas.Count > 0 ? _lecturas.Max(l => l.Id) + 1 : 1;
        lectura.FechaHora = DateTime.UtcNow;
        _lecturas.Add(lectura);

        var sensor = _sensores.FirstOrDefault(s => s.Id == lectura.SensorId);
        if (sensor is not null)
        {
            sensor.ValorActual = lectura.Valor;
            sensor.UltimaLectura = lectura.FechaHora;
        }

        return Task.FromResult(lectura);
    }

    public Task<List<Alerta>> GetAlertasAsync(bool? activas = null)
    {
        var result = _alertas.AsEnumerable();
        if (activas.HasValue)
            result = result.Where(a => a.Activa == activas.Value);

        return Task.FromResult(result.OrderByDescending(a => a.FechaHora).ToList());
    }

    public Task<Alerta?> GetAlertaByIdAsync(int id) =>
        Task.FromResult(_alertas.FirstOrDefault(a => a.Id == id));

    public Task<Alerta> CreateAlertaAsync(Alerta alerta)
    {
        alerta.Id = _alertas.Count > 0 ? _alertas.Max(a => a.Id) + 1 : 1;
        alerta.FechaHora = DateTime.UtcNow;
        alerta.Activa = true;
        _alertas.Add(alerta);
        return Task.FromResult(alerta);
    }

    public Task<Alerta?> CerrarAlertaAsync(int id)
    {
        var alerta = _alertas.FirstOrDefault(a => a.Id == id);
        if (alerta is null)
            return Task.FromResult<Alerta?>(null);

        alerta.Activa = false;
        return Task.FromResult<Alerta?>(alerta);
    }

    public Task<List<HistorialEvento>> GetHistorialAsync() =>
        Task.FromResult(_historial.OrderByDescending(h => h.FechaHora).ToList());

    public Task<HistorialEvento> CreateHistorialEventoAsync(HistorialEvento evento)
    {
        evento.Id = _historial.Count > 0 ? _historial.Max(h => h.Id) + 1 : 1;
        _historial.Add(evento);
        return Task.FromResult(evento);
    }

    public Task<List<Bitacora>> GetBitacoraAsync() =>
        Task.FromResult(_bitacora.OrderByDescending(b => b.FechaHora).ToList());

    public Task<Bitacora> CreateBitacoraAsync(Bitacora bitacora)
    {
        bitacora.Id = _bitacora.Count > 0 ? _bitacora.Max(b => b.Id) + 1 : 1;
        bitacora.FechaHora = DateTime.UtcNow;
        _bitacora.Add(bitacora);
        return Task.FromResult(bitacora);
    }

    public Task<List<Sensor>> GetSensoresActivosAsync() =>
        Task.FromResult(_sensores.Where(s => s.Activo).ToList());

    public Task<List<ConfiguracionAlerta>> GetConfiguracionAlertasAsync(string? tipoSensor = null)
    {
        var result = new List<ConfiguracionAlerta>
        {
            new() { Id = 1, TipoSensor = "NIVEL_RIO", Nivel = "AMARILLO", ValorMinimo = 2.5m, Fenomeno = "INUNDACION", Mensaje = "El nivel del río está elevado.", Activo = true },
            new() { Id = 2, TipoSensor = "NIVEL_RIO", Nivel = "NARANJA", ValorMinimo = 3.5m, Fenomeno = "INUNDACION", Mensaje = "El nivel del río está en alerta moderada.", Activo = true },
            new() { Id = 3, TipoSensor = "NIVEL_RIO", Nivel = "ROJO", ValorMinimo = 4.5m, Fenomeno = "INUNDACION", Mensaje = "El nivel del río supera el límite de seguridad.", Activo = true },
            new() { Id = 4, TipoSensor = "VIENTO", Nivel = "AMARILLO", ValorMinimo = 40m, Fenomeno = "TORMENTA", Mensaje = "Se registró viento fuerte.", Activo = true },
            new() { Id = 5, TipoSensor = "VIENTO", Nivel = "NARANJA", ValorMinimo = 60m, Fenomeno = "TORMENTA", Mensaje = "La velocidad del viento está alta.", Activo = true },
            new() { Id = 6, TipoSensor = "VIENTO", Nivel = "ROJO", ValorMinimo = 80m, Fenomeno = "TORMENTA", Mensaje = "La velocidad del viento supera el límite seguro.", Activo = true }
        };

        if (!string.IsNullOrWhiteSpace(tipoSensor))
            result = result.Where(r => r.TipoSensor == tipoSensor && r.Activo).ToList();

        return Task.FromResult(result.OrderByDescending(r => r.ValorMinimo).ToList());
    }

    public Task<ConfiguracionAlerta?> GetConfiguracionAlertaByIdAsync(int id) =>
        Task.FromResult(new List<ConfiguracionAlerta>
        {
            new() { Id = 1, TipoSensor = "NIVEL_RIO", Nivel = "AMARILLO", ValorMinimo = 2.5m, Fenomeno = "INUNDACION", Mensaje = "El nivel del río está elevado.", Activo = true },
            new() { Id = 2, TipoSensor = "NIVEL_RIO", Nivel = "NARANJA", ValorMinimo = 3.5m, Fenomeno = "INUNDACION", Mensaje = "El nivel del río está en alerta moderada.", Activo = true },
            new() { Id = 3, TipoSensor = "NIVEL_RIO", Nivel = "ROJO", ValorMinimo = 4.5m, Fenomeno = "INUNDACION", Mensaje = "El nivel del río supera el límite de seguridad.", Activo = true },
            new() { Id = 4, TipoSensor = "VIENTO", Nivel = "AMARILLO", ValorMinimo = 40m, Fenomeno = "TORMENTA", Mensaje = "Se registró viento fuerte.", Activo = true },
            new() { Id = 5, TipoSensor = "VIENTO", Nivel = "NARANJA", ValorMinimo = 60m, Fenomeno = "TORMENTA", Mensaje = "La velocidad del viento está alta.", Activo = true },
            new() { Id = 6, TipoSensor = "VIENTO", Nivel = "ROJO", ValorMinimo = 80m, Fenomeno = "TORMENTA", Mensaje = "La velocidad del viento supera el límite seguro.", Activo = true }
        }.FirstOrDefault(r => r.Id == id));

    public Task<ConfiguracionAlerta> CreateConfiguracionAlertaAsync(ConfiguracionAlerta config)
    {
        config.Id = 101;
        return Task.FromResult(config);
    }

    public Task<ConfiguracionAlerta?> UpdateConfiguracionAlertaAsync(int id, ConfiguracionAlerta config)
    {
        var current = new List<ConfiguracionAlerta>
        {
            new() { Id = 1, TipoSensor = "NIVEL_RIO", Nivel = "AMARILLO", ValorMinimo = 2.5m, Fenomeno = "INUNDACION", Mensaje = "El nivel del río está elevado.", Activo = true },
            new() { Id = 2, TipoSensor = "NIVEL_RIO", Nivel = "NARANJA", ValorMinimo = 3.5m, Fenomeno = "INUNDACION", Mensaje = "El nivel del río está en alerta moderada.", Activo = true },
            new() { Id = 3, TipoSensor = "NIVEL_RIO", Nivel = "ROJO", ValorMinimo = 4.5m, Fenomeno = "INUNDACION", Mensaje = "El nivel del río supera el límite de seguridad.", Activo = true },
            new() { Id = 4, TipoSensor = "VIENTO", Nivel = "AMARILLO", ValorMinimo = 40m, Fenomeno = "TORMENTA", Mensaje = "Se registró viento fuerte.", Activo = true },
            new() { Id = 5, TipoSensor = "VIENTO", Nivel = "NARANJA", ValorMinimo = 60m, Fenomeno = "TORMENTA", Mensaje = "La velocidad del viento está alta.", Activo = true },
            new() { Id = 6, TipoSensor = "VIENTO", Nivel = "ROJO", ValorMinimo = 80m, Fenomeno = "TORMENTA", Mensaje = "La velocidad del viento supera el límite seguro.", Activo = true }
        }.FirstOrDefault(r => r.Id == id);

        if (current is null)
            return Task.FromResult<ConfiguracionAlerta?>(null);

        current.TipoSensor = config.TipoSensor;
        current.Nivel = config.Nivel;
        current.ValorMinimo = config.ValorMinimo;
        current.Fenomeno = config.Fenomeno;
        current.Mensaje = config.Mensaje;
        current.Activo = config.Activo;
        return Task.FromResult<ConfiguracionAlerta?>(current);
    }

    public Task<bool> DeleteConfiguracionAlertaAsync(int id) => Task.FromResult(id > 0);

    public Task<DashboardSnapshot> GetDashboardSnapshotAsync()
    {
        var temps = _sensores.FirstOrDefault(s => s.Tipo == "TEMPERATURA");
        var humedad = _sensores.FirstOrDefault(s => s.Tipo == "HUMEDAD");
        var viento = _sensores.FirstOrDefault(s => s.Tipo == "VIENTO");
        var lluvia = _sensores.FirstOrDefault(s => s.Tipo == "LLUVIA");
        var nivelRio = _sensores.FirstOrDefault(s => s.Tipo == "NIVEL_RIO");

        var snapshot = new DashboardSnapshot
        {
            Temperatura = temps?.ValorActual ?? 0m,
            Humedad = humedad?.ValorActual ?? 0m,
            Viento = viento?.ValorActual ?? 0m,
            Lluvia = lluvia?.ValorActual ?? 0m,
            NivelRio = nivelRio?.ValorActual ?? 0m,
            AlertasActivas = _alertas.Count(a => a.Activa),
            SensoresActivos = _sensores.Count(s => s.Activo),
            SensoresTotales = _sensores.Count,
            NivelGeneral = "VERDE"
        };

        if (snapshot.NivelRio >= 3.5m)
            snapshot.NivelGeneral = "NARANJA";

        if (snapshot.NivelRio > 4.5m)
            snapshot.NivelGeneral = "ROJO";

        if (snapshot.Viento >= 40m && snapshot.Viento < 60m)
            snapshot.NivelGeneral = "AMARILLO";

        return Task.FromResult(snapshot);
    }
}
