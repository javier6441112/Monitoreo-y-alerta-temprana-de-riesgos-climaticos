using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.DTOs.Historial;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class HistorialController : ControllerBase
{
    private readonly IHistorialService _historialService;

    public HistorialController(IHistorialService historialService)
    {
        _historialService = historialService;
    }

    [HttpGet]
    public async Task<ActionResult<List<HistorialDto>>> GetAll([FromQuery] HistorialFiltersDto filters)
    {
        var historial = await _historialService.GetAllAsync(filters);
        return Ok(historial);
    }

    [HttpGet("estadisticas")]
    public async Task<ActionResult<EstadisticasHistorialDto>> GetStatistics([FromQuery] HistorialFiltersDto filters)
    {
        var estadisticas = await _historialService.GetStatisticsAsync(filters);
        return Ok(estadisticas);
    }
}
