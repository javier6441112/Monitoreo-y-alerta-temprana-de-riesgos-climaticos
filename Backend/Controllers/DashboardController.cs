using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.DTOs.Dashboard;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> GetDashboard([FromQuery] DashboardFiltersDto filters)
    {
        var dashboard = await _dashboardService.GetAsync(filters);
        return Ok(dashboard);
    }

    [HttpGet("series")]
    public async Task<ActionResult<List<DashboardSeriesDto>>> GetSeries([FromQuery] DashboardFiltersDto filters)
    {
        var series = await _dashboardService.GetSeriesAsync(filters);
        return Ok(series);
    }
}
