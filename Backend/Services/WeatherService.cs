using WeatherRisk.Api.DTOs.Alertas;
using WeatherRisk.Api.DTOs.Auth;
using WeatherRisk.Api.DTOs.Dashboard;
using WeatherRisk.Api.DTOs.Lecturas;
using WeatherRisk.Api.DTOs.Sensores;
using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public class WeatherService : IWeatherService
{
    private readonly IWeatherRepository _repository;

    public WeatherService(IWeatherRepository repository)
    {
        _repository = repository;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        var usuario = await _repository.GetUsuarioByUsernameAsync(request.Username);

        if (usuario is null || !usuario.Activo || !usuario.PasswordHash.Equals(request.Password, StringComparison.Ordinal))
            throw new InvalidOperationException("Credenciales inválidas");

        return new LoginResponseDto
        {
            Token = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{usuario.Username}:{DateTime.UtcNow:O}")),
            ExpiresAt = DateTime.UtcNow.AddHours(8),
            User = new UsuarioSummaryDto
            {
                Id = usuario.Id,
                Username = usuario.Username,
                Nombre = usuario.Nombre,
                Rol = usuario.Rol
            }
        };
    }

    public Task<UsuarioSummaryDto> GetCurrentUserAsync()
    {
        return Task.FromResult(new UsuarioSummaryDto
        {
            Id = 1,
            Username = "admin",
            Nombre = "Administrador",
            Rol = "ADMIN"
        });
    }

    public async Task<List<Usuario>> GetUsuariosAsync() => await _repository.GetUsuariosAsync();

    public async Task<List<SensorDto>> GetSensoresAsync()
    {
        var sensores = await _repository.GetSensoresAsync();
        return sensores.Select(MapSensor).ToList();
    }

    public async Task<SensorDto?> GetSensorByIdAsync(int id)
    {
        var sensor = await _repository.GetSensorByIdAsync(id);
        return sensor is null ? null : MapSensor(sensor);
    }

    public async Task<SensorDto> CreateSensorAsync(CreateSensorRequestDto request)
    {
        var sensor = new Sensor
        {
            Nombre = request.Nombre,
            Tipo = request.Tipo,
            Unidad = request.Unidad,
            ComunidadId = request.ComunidadId,
            Activo = true,
            ValorActual = 0m
        };

        var created = await _repository.CreateSensorAsync(sensor);
        return MapSensor(created);
    }

    public async Task<SensorDto?> UpdateSensorAsync(int id, UpdateSensorRequestDto request)
    {
        var sensor = await _repository.GetSensorByIdAsync(id);
        if (sensor is null)
            return null;

        sensor.Nombre = request.Nombre;
        sensor.Tipo = request.Tipo;
        sensor.Unidad = request.Unidad;
        sensor.ComunidadId = request.ComunidadId;

        var updated = await _repository.UpdateSensorAsync(id, sensor);
        return updated is null ? null : MapSensor(updated);
    }

    public async Task<bool> DeleteSensorAsync(int id) => await _repository.DeleteSensorAsync(id);

    public async Task<List<LecturaDto>> GetLecturasAsync(int? sensorId, DateTime? fechaInicio, DateTime? fechaFin)
    {
        var lecturas = await _repository.GetLecturasAsync(sensorId, fechaInicio, fechaFin);
        return lecturas.Select(l => new LecturaDto
        {
            Id = l.Id,
            SensorId = l.SensorId,
            Valor = l.Valor,
            FechaHora = l.FechaHora
        }).ToList();
    }

    public async Task<LecturaDto> CreateLecturaAsync(CreateLecturaRequestDto request)
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

        await EvaluarYRegistrarAlertaAsync(sensor, lectura.Valor);

        return new LecturaDto
        {
            Id = lectura.Id,
            SensorId = lectura.SensorId,
            Valor = lectura.Valor,
            FechaHora = lectura.FechaHora
        };
    }

    public async Task<List<AlertaDto>> GetAlertasAsync(bool? activas = null)
    {
        var alertas = await _repository.GetAlertasAsync(activas);
        return alertas.Select(a => new AlertaDto
        {
            Id = a.Id,
            Nivel = a.Nivel,
            Fenomeno = a.Fenomeno,
            Mensaje = a.Mensaje,
            SensorId = a.SensorId,
            ValorDetectado = a.ValorDetectado,
            FechaHora = a.FechaHora,
            Activa = a.Activa
        }).ToList();
    }

    public async Task<AlertaDto?> CerrarAlertaAsync(int id)
    {
        var alerta = await _repository.CerrarAlertaAsync(id);
        if (alerta is null)
            return null;

        return new AlertaDto
        {
            Id = alerta.Id,
            Nivel = alerta.Nivel,
            Fenomeno = alerta.Fenomeno,
            Mensaje = alerta.Mensaje,
            SensorId = alerta.SensorId,
            ValorDetectado = alerta.ValorDetectado,
            FechaHora = alerta.FechaHora,
            Activa = alerta.Activa
        };
    }

    public async Task<List<HistorialEvento>> GetHistorialAsync() => await _repository.GetHistorialAsync();

    public async Task<List<Bitacora>> GetBitacoraAsync() => await _repository.GetBitacoraAsync();

    public async Task<DashboardDto> GetDashboardAsync()
    {
        var snapshot = await _repository.GetDashboardSnapshotAsync();

        return new DashboardDto
        {
            Temperatura = new DashboardMetricDto { Valor = snapshot.Temperatura, Unidad = "°C" },
            Humedad = new DashboardMetricDto { Valor = snapshot.Humedad, Unidad = "%" },
            Viento = new DashboardMetricDto { Valor = snapshot.Viento, Unidad = "km/h" },
            Lluvia = new DashboardMetricDto { Valor = snapshot.Lluvia, Unidad = "mm/h" },
            NivelRio = new DashboardMetricDto { Valor = snapshot.NivelRio, Unidad = "m" },
            NivelGeneral = snapshot.NivelGeneral,
            AlertasActivas = snapshot.AlertasActivas,
            SensoresActivos = snapshot.SensoresActivos,
            SensoresTotales = snapshot.SensoresTotales
        };
    }

    public async Task<string> ReiniciarMonitoreoAsync()
    {
        await _repository.CreateBitacoraAsync(new Bitacora
        {
            UsuarioId = 1,
            Usuario = "admin",
            Accion = "REINICIAR_MONITOREO",
            Descripcion = "Se reinició el sistema de monitoreo."
        });

        return "Sistema de monitoreo reiniciado correctamente.";
    }

    private static SensorDto MapSensor(Sensor sensor) => new()
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

    private async Task EvaluarYRegistrarAlertaAsync(Sensor sensor, decimal valor)
    {
        if (sensor.Tipo == "NIVEL_RIO")
        {
            if (valor >= 4.5m)
                await RegistrarAlertaAsync(sensor, valor, "ROJO", "INUNDACION", "El nivel del río supera el límite de seguridad.");
            else if (valor >= 3.5m)
                await RegistrarAlertaAsync(sensor, valor, "NARANJA", "INUNDACION", "El nivel del río está en alerta moderada.");
            else if (valor >= 2.5m)
                await RegistrarAlertaAsync(sensor, valor, "AMARILLO", "INUNDACION", "El nivel del río está elevado.");
        }

        if (sensor.Tipo == "VIENTO")
        {
            if (valor > 80m)
                await RegistrarAlertaAsync(sensor, valor, "ROJO", "TORMENTA", "La velocidad del viento supera el límite seguro.");
            else if (valor > 60m)
                await RegistrarAlertaAsync(sensor, valor, "NARANJA", "TORMENTA", "La velocidad del viento está alta.");
            else if (valor > 40m)
                await RegistrarAlertaAsync(sensor, valor, "AMARILLO", "TORMENTA", "Se registró viento fuerte.");
        }
    }

    private async Task RegistrarAlertaAsync(Sensor sensor, decimal valor, string nivel, string fenomeno, string mensaje)
    {
        var alerta = await _repository.CreateAlertaAsync(new Alerta
        {
            SensorId = sensor.Id,
            Nivel = nivel,
            Fenomeno = fenomeno,
            Mensaje = mensaje,
            ValorDetectado = valor,
            Activa = true
        });

        await _repository.CreateBitacoraAsync(new Bitacora
        {
            UsuarioId = 1,
            Usuario = "admin",
            Accion = "ALERTA_GENERADA",
            Descripcion = $"Se generó alerta {nivel} para {sensor.Nombre}."
        });

        await _repository.GetHistorialAsync();
        await _repository.CreateBitacoraAsync(new Bitacora
        {
            UsuarioId = 1,
            Usuario = "admin",
            Accion = "REGISTRO_HISTORIAL",
            Descripcion = $"Evento {fenomeno} registrado para {sensor.Nombre}."
        });

        var evento = new HistorialEvento
        {
            SensorId = sensor.Id,
            AlertaId = alerta.Id,
            Fenomeno = fenomeno,
            Nivel = nivel,
            Mensaje = mensaje,
            FechaHora = DateTime.UtcNow
        };

        var historial = await _repository.GetHistorialAsync();
        historial.Add(evento);
    }
}
