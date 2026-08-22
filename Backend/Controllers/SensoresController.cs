using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.DTOs.Sensores;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class SensoresController : ControllerBase
{
    private readonly ISensoresService _sensoresService;

    public SensoresController(ISensoresService sensoresService)
    {
        _sensoresService = sensoresService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SensorDto>>> GetAll()
    {
        var sensores = await _sensoresService.GetAllAsync();
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
    public async Task<ActionResult<SensorDto>> Create([FromBody] CreateSensorRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            return BadRequest(new { status = 400, message = "El nombre del sensor es obligatorio.", errors = Array.Empty<string>() });

        var sensor = await _sensoresService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = sensor.Id }, sensor);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<SensorDto>> Update(int id, [FromBody] UpdateSensorRequestDto request)
    {
        var sensor = await _sensoresService.UpdateAsync(id, request);
        if (sensor is null)
            return NotFound(new { status = 404, message = "Sensor no encontrado.", errors = Array.Empty<string>() });

        return Ok(sensor);
    }

    [HttpPatch("{id:int}/estado")]
    public async Task<ActionResult<SensorDto>> UpdateEstado(int id, [FromBody] UpdateSensorEstadoRequestDto request)
    {
        var sensor = await _sensoresService.GetByIdAsync(id);
        if (sensor is null)
            return NotFound(new { status = 404, message = "Sensor no encontrado.", errors = Array.Empty<string>() });

        sensor.Activo = request.Activo;
        var updated = await _sensoresService.UpdateAsync(id, new UpdateSensorRequestDto
        {
            Nombre = sensor.Nombre,
            Tipo = sensor.Tipo,
            Unidad = sensor.Unidad,
            ComunidadId = sensor.ComunidadId,
            Activo = request.Activo,
        });

        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Delete(int id)
    {
        var deleted = await _sensoresService.DeleteAsync(id);
        if (!deleted)
            return NotFound(new { status = 404, message = "Sensor no encontrado.", errors = Array.Empty<string>() });

        return NoContent();
    }
}
