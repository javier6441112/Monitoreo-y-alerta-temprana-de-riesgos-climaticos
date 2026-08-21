using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.DTOs.Auth;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IWeatherService _weatherService;

    public AuthController(IWeatherService weatherService)
    {
        _weatherService = weatherService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            var response = await _weatherService.LoginAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { status = 401, message = ex.Message, errors = Array.Empty<string>() });
        }
    }

    [HttpGet("me")]
    public async Task<ActionResult<UsuarioSummaryDto>> GetCurrentUser()
    {
        var user = await _weatherService.GetCurrentUserAsync();
        return Ok(user);
    }
}
