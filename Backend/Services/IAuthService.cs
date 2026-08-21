using WeatherRisk.Api.DTOs.Auth;
using System.Security.Claims;

namespace WeatherRisk.Api.Services;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    UsuarioSummaryDto GetCurrentUser(ClaimsPrincipal principal);
}