using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
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
    [AllowAnonymous]
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
    [Authorize]
    public async Task<ActionResult<UsuarioSummaryDto>> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(ClaimTypes.Name)
            ?? string.Empty;
        var username = User.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

        return Ok(new UsuarioSummaryDto
        {
            Id = int.TryParse(userId, out var id) ? id : 0,
            Username = username,
            Nombre = username,
            Rol = role
        });
    }
}
