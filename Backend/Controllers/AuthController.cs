using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using WeatherRisk.Api.DTOs.Auth;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly TokenRevocationService _tokenRevocationService;

    public AuthController(IAuthService authService, TokenRevocationService tokenRevocationService)
    {
        _authService = authService;
        _tokenRevocationService = tokenRevocationService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return Unauthorized(new { status = 401, message = ex.Message, errors = Array.Empty<string>() });
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var authorization = Request.Headers.Authorization.ToString();
        var parts = authorization.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 2 || !parts[0].Equals("Bearer", StringComparison.OrdinalIgnoreCase))
            return Unauthorized();

        var token = new JwtSecurityTokenHandler().ReadJwtToken(parts[1]);
        if (string.IsNullOrWhiteSpace(token.Id))
            return Unauthorized();

        await _tokenRevocationService.RevokeAsync(token.Id, token.ValidTo, HttpContext.RequestAborted);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UsuarioSummaryDto>> GetCurrentUser()
    {
        return Ok(_authService.GetCurrentUser(User));
    }
}
