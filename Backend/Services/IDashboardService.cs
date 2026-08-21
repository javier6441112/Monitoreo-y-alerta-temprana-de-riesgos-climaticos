using WeatherRisk.Api.DTOs.Dashboard;

namespace WeatherRisk.Api.Services;

public interface IDashboardService
{
    Task<DashboardDto> GetAsync();
}