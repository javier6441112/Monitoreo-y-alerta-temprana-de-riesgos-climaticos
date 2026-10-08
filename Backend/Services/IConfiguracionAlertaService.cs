using WeatherRisk.Api.DTOs.Alertas;

namespace WeatherRisk.Api.Services;

public interface IConfiguracionAlertaService
{
    Task<List<ConfiguracionAlertaDto>> GetAllAsync(string? tipoSensor = null, bool? activo = null);
    Task<ConfiguracionAlertaDto?> GetByIdAsync(int id);
    Task<ConfiguracionAlertaDto> CreateAsync(CreateConfiguracionAlertaRequestDto request);
    Task<ConfiguracionAlertaDto?> UpdateAsync(int id, UpdateConfiguracionAlertaRequestDto request);
    Task<ConfiguracionAlertaDto?> SetActiveAsync(int id, bool activo);
    Task<bool> DeleteAsync(int id);
}
