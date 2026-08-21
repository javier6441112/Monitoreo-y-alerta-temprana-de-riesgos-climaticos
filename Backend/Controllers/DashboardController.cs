using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.DTOs.Dashboard;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IWeatherService _weatherService;

    public DashboardController(IWeatherService weatherService)
    {
        _weatherService = weatherService;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> GetDashboard()
    {
        var dashboard = await _weatherService.GetDashboardAsync();
        return Ok(dashboard);
    }
}
