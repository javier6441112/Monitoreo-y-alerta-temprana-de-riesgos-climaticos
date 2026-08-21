using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.Models;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BitacoraController : ControllerBase
{
    private readonly IWeatherService _weatherService;

    public BitacoraController(IWeatherService weatherService)
    {
        _weatherService = weatherService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Bitacora>>> GetAll()
    {
        var bitacora = await _weatherService.GetBitacoraAsync();
        return Ok(bitacora);
    }
}
