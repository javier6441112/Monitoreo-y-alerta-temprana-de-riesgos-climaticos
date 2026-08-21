using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class MonitoreoController : ControllerBase
{
    private readonly IMonitoreoService _monitoreoService;

    public MonitoreoController(IMonitoreoService monitoreoService)
    {
        _monitoreoService = monitoreoService;
    }

    [HttpPost("reiniciar")]
    public async Task<ActionResult> Reiniciar()
    {
        var username = User.Identity?.Name ?? "desconocido";
        var userId = int.TryParse(User.FindFirst("sub")?.Value, out var parsedId) ? parsedId : (int?)null;
        var mensaje = await _monitoreoService.RestartAsync(username, userId);
        return Ok(new { mensaje, fechaHora = DateTime.UtcNow });
    }
}
