using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MonitoreoController : ControllerBase
{
    private readonly IWeatherService _weatherService;

    public MonitoreoController(IWeatherService weatherService)
    {
        _weatherService = weatherService;
    }

    [HttpPost("reiniciar")]
    public async Task<ActionResult> Reiniciar()
    {
        var mensaje = await _weatherService.ReiniciarMonitoreoAsync();
        return Ok(new { mensaje, fechaHora = DateTime.UtcNow });
    }
}
