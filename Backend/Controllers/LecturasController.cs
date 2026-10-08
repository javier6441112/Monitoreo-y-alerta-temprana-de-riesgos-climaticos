using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.DTOs.Lecturas;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/lecturas")]
public class LecturasController : ControllerBase
{
    private readonly ILecturasService _lecturasService;

    public LecturasController(ILecturasService lecturasService)
    {
        _lecturasService = lecturasService;
    }

    [HttpGet]
    public async Task<ActionResult<List<LecturaDto>>> Get(
        [FromQuery] int? sensorId,
        [FromQuery] int? comunidadId,
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta)
    {
        var lecturas = await _lecturasService.GetAllAsync(sensorId, comunidadId, desde, hasta);
        return Ok(lecturas);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN, OPERADOR")]
    public async Task<ActionResult<LecturaDto>> Create([FromBody] CreateLecturaRequestDto request)
    {
        try
        {
            var lectura = await _lecturasService.CreateAsync(request);
            return Ok(lectura);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { status = 404, message = ex.Message, errors = Array.Empty<string>() });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { status = 400, message = ex.Message, errors = Array.Empty<string>() });
        }
    }
}
