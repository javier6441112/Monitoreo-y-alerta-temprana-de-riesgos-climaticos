using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.Models;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly IWeatherService _weatherService;

    public UsuariosController(IWeatherService weatherService)
    {
        _weatherService = weatherService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Usuario>>> GetUsuarios()
    {
        var usuarios = await _weatherService.GetUsuariosAsync();
        return Ok(usuarios);
    }
}
