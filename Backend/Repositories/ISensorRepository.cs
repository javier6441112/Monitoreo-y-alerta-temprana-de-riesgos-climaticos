using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Repositories;

public interface ISensorRepository
{
    Task<List<Sensor>> GetSensoresAsync();
    Task<Sensor?> GetSensorByIdAsync(int id);
    Task<Sensor> CreateSensorAsync(Sensor sensor);
    Task<Sensor?> UpdateSensorAsync(int id, Sensor sensor);
    Task<bool> DeleteSensorAsync(int id);
    Task<List<LecturaSensor>> GetLecturasAsync(int? sensorId = null, DateTime? desde = null, DateTime? hasta = null, int? comunidadId = null);
    Task<LecturaSensor> CreateLecturaAsync(LecturaSensor lectura);
    Task<List<Sensor>> GetSensoresActivosAsync();
    Task<List<Sensor>> GetFilteredSensoresAsync(string? codigo, string? tipo, bool? activo, int? comunidadId, string? buscar);
    Task<bool> SetSensorActivoAsync(int id, bool activo);
}
