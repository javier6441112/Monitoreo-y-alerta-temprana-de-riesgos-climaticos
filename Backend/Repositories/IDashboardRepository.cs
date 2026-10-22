using WeatherRisk.Api.DTOs.Dashboard;

namespace WeatherRisk.Api.Repositories;

public interface IDashboardRepository
{
    Task<DashboardSnapshot> GetDashboardSnapshotAsync(DashboardFiltersDto filters);
    Task<List<DashboardSeriesDto>> GetDashboardSeriesAsync(DashboardFiltersDto filters);
}
