using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.DTOs.Lecturas;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class LecturasController : ControllerBase
{
    private readonly IWeatherService _weatherService;

    public LecturasController(IWeatherService weatherService)
    {
        _weatherService = weatherService;
    }

    [HttpGet]
    public async Task<ActionResult<List<LecturaDto>>> Get([FromQuery] int? sensorId, [FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin)
    {
        var lecturas = await _weatherService.GetLecturasAsync(sensorId, fechaInicio, fechaFin);
        return Ok(lecturas);
    }

    [HttpPost]
    public async Task<ActionResult<LecturaDto>> Create([FromBody] CreateLecturaRequestDto request)
    {
        try
        {
            var lectura = await _weatherService.CreateLecturaAsync(request);
            return Ok(lectura);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { status = 404, message = ex.Message, errors = Array.Empty<string>() });
        }
    }
}
