using WeatherRisk.Api.DTOs.Sensores;

namespace WeatherRisk.Api.Services;

public interface ISensoresService
{
    Task<List<SensorDto>> GetAllAsync();
    Task<SensorDto?> GetByIdAsync(int id);
    Task<SensorDto> CreateAsync(CreateSensorRequestDto request);
    Task<SensorDto?> UpdateAsync(int id, UpdateSensorRequestDto request);
    Task<bool> DeleteAsync(int id);
}