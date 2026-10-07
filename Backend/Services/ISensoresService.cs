using WeatherRisk.Api.DTOs.Sensores;

namespace WeatherRisk.Api.Services;

public interface ISensoresService
{
    Task<List<SensorDto>> GetAllAsync(string? codigo, string? tipo, bool? activo, int? comunidadId, string? buscar);
    Task<SensorDto?> GetByIdAsync(int id);
    Task<SensorDto> CreateAsync(CreateSensorRequestDto request);
    Task<SensorDto?> UpdateAsync(int id, UpdateSensorRequestDto request);
    Task<bool> UpdateStateAsync(int id, bool activo);
    Task<bool> DeleteAsync(int id);
}