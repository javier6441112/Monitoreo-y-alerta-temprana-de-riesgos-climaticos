using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.DTOs.Alertas;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ConfiguracionAlertasController : ControllerBase
{
    private readonly IConfiguracionAlertaService _service;

    public ConfiguracionAlertasController(IConfiguracionAlertaService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<ConfiguracionAlertaDto>>> GetAll([FromQuery] string? tipoSensor = null, [FromQuery] bool? activo = null)
    {
        var config = await _service.GetAllAsync(tipoSensor, activo);
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
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ConfiguracionAlertaDto>> Create([FromBody] CreateConfiguracionAlertaRequestDto request)
    {
        var validationError = ValidateRequest(request);
        if (validationError is not null)
            return BadRequest(new { status = 400, message = validationError, errors = Array.Empty<string>() });

        NormalizeRequest(request);

        var created = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ConfiguracionAlertaDto>> Update(int id, [FromBody] UpdateConfiguracionAlertaRequestDto request)
    {
        var validationError = ValidateRequest(request);
        if (validationError is not null)
            return BadRequest(new { status = 400, message = validationError, errors = Array.Empty<string>() });

        NormalizeRequest(request);
        var updated = await _service.UpdateAsync(id, request);
        if (updated is null)
            return NotFound(new { status = 404, message = "Configuración no encontrada.", errors = Array.Empty<string>() });

        return Ok(updated);
    }

    [HttpPatch("{id:int}/estado")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ConfiguracionAlertaDto>> SetState(int id, [FromBody] UpdateConfiguracionAlertaEstadoRequestDto request)
    {
        var updated = await _service.SetActiveAsync(id, request.Activo);
        if (updated is null)
            return NotFound(new { status = 404, message = "Configuración no encontrada.", errors = Array.Empty<string>() });

        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { status = 404, message = "Configuración no encontrada.", errors = Array.Empty<string>() });

        return NoContent();
    }

    private static string? ValidateRequest(CreateConfiguracionAlertaRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre) || request.Nombre.Trim().Length > 200)
            return "El nombre es obligatorio y no puede superar 200 caracteres.";
        if (string.IsNullOrWhiteSpace(request.TipoSensor))
            return "El tipo de sensor es obligatorio.";
        if (string.IsNullOrWhiteSpace(request.Nivel))
            return "El nivel es obligatorio.";
        if (request.Nivel.Trim().ToUpperInvariant() is not ("ROJO" or "NARANJA" or "AMARILLO" or "VERDE"))
            return "El nivel debe ser ROJO, NARANJA, AMARILLO o VERDE.";
        if (!request.ValorMinimo.HasValue && !request.ValorMaximo.HasValue)
            return "Debe indicar al menos un límite.";
        if (request.ValorMinimo.HasValue && request.ValorMaximo.HasValue && request.ValorMinimo > request.ValorMaximo)
            return "El valor mínimo no puede ser mayor que el máximo.";
        if (string.IsNullOrWhiteSpace(request.Fenomeno))
            return "El fenómeno es obligatorio.";
        if (string.IsNullOrWhiteSpace(request.Mensaje))
            return "El mensaje es obligatorio.";

        return null;
    }

    private static void NormalizeRequest(CreateConfiguracionAlertaRequestDto request)
    {
        request.Nombre = request.Nombre.Trim();
        request.TipoSensor = request.TipoSensor.Trim().ToUpperInvariant();
        request.Nivel = request.Nivel.Trim().ToUpperInvariant();
        request.Fenomeno = request.Fenomeno.Trim().ToUpperInvariant();
        request.Mensaje = request.Mensaje.Trim();
    }
}
