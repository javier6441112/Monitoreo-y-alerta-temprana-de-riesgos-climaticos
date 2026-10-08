using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.DTOs.Alertas;
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
    public async Task<ActionResult> GetAll(
        [FromQuery] bool? activas,
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] int? comunidadId,
        [FromQuery] int? sensorId,
        [FromQuery] string? fenomeno,
        [FromQuery] string? nivel,
        [FromQuery] string? estado)
    {
        var alertas = await _alertasService.GetAllAsync(activas, desde, hasta, comunidadId, sensorId, fenomeno, nivel, estado);
        return Ok(alertas);
    }

    [HttpGet("activas")]
    public async Task<ActionResult> GetActivas()
    {
        var alertas = await _alertasService.GetAllAsync(true);
        return Ok(alertas);
    }

    [HttpPatch("{id:int}/estado")]
    [Authorize(Roles = "ADMIN, OPERADOR")]
    public async Task<ActionResult> SetState(int id, [FromBody] ChangeAlertStateRequestDto request)
    {
        var alerta = await _alertasService.SetStateAsync(id, request.Estado);
        if (alerta is null)
            return NotFound(new { status = 404, message = "Alerta no encontrada.", errors = Array.Empty<string>() });

        return Ok(alerta);
    }

    [HttpPost("{id:int}/cerrar")]
    [Authorize(Roles = "ADMIN, OPERADOR")]
    public async Task<ActionResult> Cerrar(int id)
    {
        var alerta = await _alertasService.CloseAsync(id);
        if (alerta is null)
            return NotFound(new { status = 404, message = "Alerta no encontrada.", errors = Array.Empty<string>() });

        return Ok(new { id = alerta.Id, activa = alerta.Activa });
    }
}
