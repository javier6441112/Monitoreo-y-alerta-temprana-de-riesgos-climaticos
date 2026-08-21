using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.DTOs.Alertas;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN")]
[Route("api/[controller]")]
public class ConfiguracionAlertasController : ControllerBase
{
    private readonly IConfiguracionAlertaService _service;

    public ConfiguracionAlertasController(IConfiguracionAlertaService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<ConfiguracionAlertaDto>>> GetAll([FromQuery] string? tipoSensor = null)
    {
        var config = await _service.GetAllAsync(tipoSensor);
        return Ok(config);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ConfiguracionAlertaDto>> GetById(int id)
    {
        var config = await _service.GetByIdAsync(id);
        if (config is null)
            return NotFound(new { status = 404, message = "Configuración no encontrada.", errors = Array.Empty<string>() });

        return Ok(config);
    }

    [HttpPost]
    public async Task<ActionResult<ConfiguracionAlertaDto>> Create([FromBody] CreateConfiguracionAlertaRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.TipoSensor))
            return BadRequest(new { status = 400, message = "El tipo de sensor es obligatorio.", errors = Array.Empty<string>() });

        if (string.IsNullOrWhiteSpace(request.Nivel))
            return BadRequest(new { status = 400, message = "El nivel es obligatorio.", errors = Array.Empty<string>() });

        if (request.ValorMinimo <= 0)
            return BadRequest(new { status = 400, message = "El valor mínimo debe ser mayor que cero.", errors = Array.Empty<string>() });

        var created = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ConfiguracionAlertaDto>> Update(int id, [FromBody] UpdateConfiguracionAlertaRequestDto request)
    {
        var updated = await _service.UpdateAsync(id, request);
        if (updated is null)
            return NotFound(new { status = 404, message = "Configuración no encontrada.", errors = Array.Empty<string>() });

        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { status = 404, message = "Configuración no encontrada.", errors = Array.Empty<string>() });

        return NoContent();
    }
}
