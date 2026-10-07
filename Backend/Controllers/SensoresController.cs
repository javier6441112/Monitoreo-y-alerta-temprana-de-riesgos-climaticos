using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.DTOs.Sensores;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/sensores")]
public class SensoresController : ControllerBase
{
    private readonly ISensoresService _sensoresService;

    public SensoresController(ISensoresService sensoresService)
    {
        _sensoresService = sensoresService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SensorDto>>> GetAll(
        [FromQuery] string? codigo,
        [FromQuery] string? tipo,
        [FromQuery] bool? activo,
        [FromQuery] int? comunidadId,
        [FromQuery] string? buscar)
    {
        var sensores = await _sensoresService.GetAllAsync(codigo, tipo, activo, comunidadId, buscar);
        return Ok(sensores);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SensorDto>> GetById(int id)
    {
        var sensor = await _sensoresService.GetByIdAsync(id);
        if (sensor is null)
            return NotFound(new { status = 404, message = "Sensor no encontrado.", errors = Array.Empty<string>() });

        return Ok(sensor);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN, OPERADOR")]
    public async Task<ActionResult<SensorDto>> Create([FromBody] CreateSensorRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre) || string.IsNullOrWhiteSpace(request.Codigo) || string.IsNullOrWhiteSpace(request.Tipo) || request.ComunidadId <= 0)
            return BadRequest(new { status = 400, message = "Los campos nombre, código, tipo y comunidadId son obligatorios.", errors = Array.Empty<string>() });

        var sensor = await _sensoresService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = sensor.Id }, sensor);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "ADMIN, OPERADOR")]
    public async Task<ActionResult<SensorDto>> Update(int id, [FromBody] UpdateSensorRequestDto request)
    {
        var sensor = await _sensoresService.UpdateAsync(id, request);
        if (sensor is null)
            return NotFound(new { status = 404, message = "Sensor no encontrado.", errors = Array.Empty<string>() });

        return Ok(sensor);
    }

    [HttpPatch("{id:int}/estado")]
    [Authorize(Roles = "ADMIN, OPERADOR")]
    public async Task<ActionResult> UpdateEstado(int id, [FromBody] UpdateSensorEstadoRequestDto request)
    {
        var updated = await _sensoresService.UpdateStateAsync(id, request.Activo);
        if (!updated)
            return NotFound(new { status = 404, message = "Sensor no encontrado.", errors = Array.Empty<string>() });

        return Ok(new
        {
            status = 200,
            message = "Estado del sensor actualizado correctamente.",
            data = new { id, activo = request.Activo }
        });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult> Delete(int id)
    {
        var deleted = await _sensoresService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { status = 404, message = "Sensor no encontrado.", errors = Array.Empty<string>() });

        return NoContent();
    }
}
