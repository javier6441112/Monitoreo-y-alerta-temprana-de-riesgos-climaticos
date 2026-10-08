using WeatherRisk.Api.DTOs.Historial;

namespace WeatherRisk.Api.Services;

public interface IHistorialService
{
    Task<List<HistorialDto>> GetAllAsync(HistorialFiltersDto filters);
    Task<EstadisticasHistorialDto> GetStatisticsAsync(HistorialFiltersDto filters);
}