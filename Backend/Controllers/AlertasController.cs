using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AlertasController : ControllerBase
{
    private readonly IWeatherService _weatherService;

    public AlertasController(IWeatherService weatherService)
    {
        _weatherService = weatherService;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll([FromQuery] bool? activas)
    {
        var alertas = await _weatherService.GetAlertasAsync(activas);
        return Ok(alertas);
    }

    [HttpGet("activas")]
    public async Task<ActionResult> GetActivas()
    {
        var alertas = await _weatherService.GetAlertasAsync(true);
        return Ok(alertas);
    }

    [HttpPost("{id:int}/cerrar")]
    public async Task<ActionResult> Cerrar(int id)
    {
        var alerta = await _weatherService.CerrarAlertaAsync(id);
        if (alerta is null)
            return NotFound(new { status = 404, message = "Alerta no encontrada.", errors = Array.Empty<string>() });

        return Ok(new { id = alerta.Id, activa = alerta.Activa });
    }
}
