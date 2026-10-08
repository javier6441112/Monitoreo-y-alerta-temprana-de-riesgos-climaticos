using WeatherRisk.Api.DTOs.Bitacora;
using WeatherRisk.Api.DTOs.Dashboard;
using WeatherRisk.Api.DTOs.Historial;
using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Repositories;

public interface IWeatherRepository
{
    Task<List<Usuario>> GetUsuariosAsync();
    Task<Usuario?> GetUsuarioByIdAsync(int id);
    Task<Usuario?> GetUsuarioByUsernameAsync(string username);
    Task<Usuario> CreateUsuarioAsync(Usuario usuario);
    Task<Usuario?> UpdateUsuarioAsync(int id, Usuario usuario);
    Task<bool> UpdateUltimoAccesoAsync(int usuarioId, DateTime ultimoAcceso);
    Task<Usuario?> SetUsuarioActivoAsync(int id, bool activo);
    Task<List<Sensor>> GetSensoresAsync();
    Task<Sensor?> GetSensorByIdAsync(int id);
    Task<Sensor> CreateSensorAsync(Sensor sensor);
    Task<Sensor?> UpdateSensorAsync(int id, Sensor sensor);
    Task<bool> DeleteSensorAsync(int id);
    Task<List<LecturaSensor>> GetLecturasAsync(int? sensorId = null, DateTime? desde = null, DateTime? hasta = null, int? comunidadId = null);
    Task<LecturaSensor> CreateLecturaAsync(LecturaSensor lectura);
    Task<List<Alerta>> GetAlertasAsync(bool? activas = null, DateTime? desde = null, DateTime? hasta = null, int? comunidadId = null, int? sensorId = null, string? fenomeno = null, string? nivel = null, string? estado = null);
    Task<Alerta?> GetAlertaByIdAsync(int id);
    Task<Alerta> CreateAlertaAsync(Alerta alerta);
    Task<Alerta?> CerrarAlertaAsync(int id);
    Task<Alerta?> SetAlertaStateAsync(int id, string estado);
    Task<List<HistorialEvento>> GetHistorialAsync();
    Task<HistorialEvento> CreateHistorialEventoAsync(HistorialEvento evento);
    Task<List<Bitacora>> GetBitacoraAsync(DateTime? desde = null, DateTime? hasta = null, int? usuarioId = null, string? accion = null, string? entidad = null);
    Task<Bitacora> CreateBitacoraAsync(Bitacora bitacora);
    Task<List<Sensor>> GetSensoresActivosAsync();
    Task<List<ConfiguracionAlerta>> GetConfiguracionAlertasAsync(string? tipoSensor = null, bool? activo = null);
    Task<ConfiguracionAlerta?> GetConfiguracionAlertaByIdAsync(int id);
    Task<ConfiguracionAlerta> CreateConfiguracionAlertaAsync(ConfiguracionAlerta config);
    Task<ConfiguracionAlerta?> UpdateConfiguracionAlertaAsync(int id, ConfiguracionAlerta config);
    Task<ConfiguracionAlerta?> SetConfiguracionAlertaStateAsync(int id, bool activo);
    Task<bool> DeleteConfiguracionAlertaAsync(int id);
    Task<DashboardSnapshot> GetDashboardSnapshotAsync(DashboardFiltersDto filters);
    Task<List<DashboardSeriesDto>> GetDashboardSeriesAsync(DashboardFiltersDto filters);
    Task<List<HistorialDto>> GetFilteredHistorialAsync(HistorialFiltersDto filters);
}

public class DashboardSnapshot
{
    public decimal Temperatura { get; set; }
    public decimal Humedad { get; set; }
    public decimal Viento { get; set; }
    public decimal Lluvia { get; set; }
    public decimal NivelRio { get; set; }
    public string NivelGeneral { get; set; } = "VERDE";
    public int AlertasActivas { get; set; }
    public int SensoresActivos { get; set; }
    public int SensoresTotales { get; set; }
}
