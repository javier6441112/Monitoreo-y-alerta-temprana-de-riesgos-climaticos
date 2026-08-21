using WeatherRisk.Api.DTOs.Alertas;

namespace WeatherRisk.Api.Services;

public interface IConfiguracionAlertaService
{
    Task<List<ConfiguracionAlertaDto>> GetAllAsync(string? tipoSensor = null);
    Task<ConfiguracionAlertaDto?> GetByIdAsync(int id);
    Task<ConfiguracionAlertaDto> CreateAsync(CreateConfiguracionAlertaRequestDto request);
    Task<ConfiguracionAlertaDto?> UpdateAsync(int id, UpdateConfiguracionAlertaRequestDto request);
    Task<bool> DeleteAsync(int id);
}
