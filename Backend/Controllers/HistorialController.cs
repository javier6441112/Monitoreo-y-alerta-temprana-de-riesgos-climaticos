using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.Models;
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
    public async Task<ActionResult<List<HistorialEvento>>> GetAll()
    {
        var historial = await _historialService.GetAllAsync();
        return Ok(historial);
    }
}
