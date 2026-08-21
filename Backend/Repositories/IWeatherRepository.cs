using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Repositories;

public interface IWeatherRepository
{
    Task<List<Usuario>> GetUsuariosAsync();
    Task<Usuario?> GetUsuarioByUsernameAsync(string username);
    Task<List<Sensor>> GetSensoresAsync();
    Task<Sensor?> GetSensorByIdAsync(int id);
    Task<Sensor> CreateSensorAsync(Sensor sensor);
    Task<Sensor?> UpdateSensorAsync(int id, Sensor sensor);
    Task<bool> DeleteSensorAsync(int id);
    Task<List<LecturaSensor>> GetLecturasAsync(int? sensorId = null, DateTime? fechaInicio = null, DateTime? fechaFin = null);
    Task<LecturaSensor> CreateLecturaAsync(LecturaSensor lectura);
    Task<List<Alerta>> GetAlertasAsync(bool? activas = null);
    Task<Alerta?> GetAlertaByIdAsync(int id);
    Task<Alerta> CreateAlertaAsync(Alerta alerta);
    Task<Alerta?> CerrarAlertaAsync(int id);
    Task<List<HistorialEvento>> GetHistorialAsync();
    Task<HistorialEvento> CreateHistorialEventoAsync(HistorialEvento evento);
    Task<List<Bitacora>> GetBitacoraAsync();
    Task<Bitacora> CreateBitacoraAsync(Bitacora bitacora);
    Task<List<Sensor>> GetSensoresActivosAsync();
    Task<DashboardSnapshot> GetDashboardSnapshotAsync();
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
