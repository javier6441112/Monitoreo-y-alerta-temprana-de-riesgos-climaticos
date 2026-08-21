using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.Models;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class HistorialController : ControllerBase
{
    private readonly IWeatherService _weatherService;

    public HistorialController(IWeatherService weatherService)
    {
        _weatherService = weatherService;
    }

    [HttpGet]
    public async Task<ActionResult<List<HistorialEvento>>> GetAll()
    {
        var historial = await _weatherService.GetHistorialAsync();
        return Ok(historial);
    }
}
