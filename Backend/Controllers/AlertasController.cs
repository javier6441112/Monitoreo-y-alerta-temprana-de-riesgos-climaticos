using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AlertasController : ControllerBase
{
    private readonly IAlertasService _alertasService;

    public AlertasController(IAlertasService alertasService)
    {
        _alertasService = alertasService;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll([FromQuery] bool? activas)
    {
        var alertas = await _alertasService.GetAllAsync(activas);
        return Ok(alertas);
    }

    [HttpGet("activas")]
    public async Task<ActionResult> GetActivas()
    {
        var alertas = await _alertasService.GetAllAsync(true);
        return Ok(alertas);
    }

    [HttpPost("{id:int}/cerrar")]
    public async Task<ActionResult> Cerrar(int id)
    {
        var alerta = await _alertasService.CloseAsync(id);
        if (alerta is null)
            return NotFound(new { status = 404, message = "Alerta no encontrada.", errors = Array.Empty<string>() });

        return Ok(new { id = alerta.Id, activa = alerta.Activa });
    }
}
