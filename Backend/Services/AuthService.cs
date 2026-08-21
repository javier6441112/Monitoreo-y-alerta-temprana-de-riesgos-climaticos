using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using WeatherRisk.Api.DTOs.Auth;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class AuthService : IAuthService
{
    private readonly IWeatherRepository _repository;
    private readonly IConfiguration _configuration;

    public AuthService(IWeatherRepository repository, IConfiguration configuration)
    {
        _repository = repository;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        var usuario = await _repository.GetUsuarioByUsernameAsync(request.Username);
        if (usuario is null || !usuario.Activo || !usuario.PasswordHash.Equals(request.Password, StringComparison.Ordinal))
            throw new InvalidOperationException("Credenciales inválidas");

        var expiresAt = DateTime.UtcNow.AddHours(8);
        var key = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("La configuración Jwt:Key es obligatoria.");
        var issuer = _configuration["Jwt:Issuer"] ?? "WeatherRisk.Api";
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.Username),
            new Claim(ClaimTypes.Role, usuario.Rol)
        };
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(issuer, issuer, claims, expires: expiresAt, signingCredentials: credentials);

        return new LoginResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAt = expiresAt,
            User = new UsuarioSummaryDto
            {
                Id = usuario.Id,
                Username = usuario.Username,
                Nombre = usuario.Nombre,
                Rol = usuario.Rol
            }
        };
    }

    public UsuarioSummaryDto GetCurrentUser(ClaimsPrincipal principal)
    {
        var subject = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var username = principal.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
        return new UsuarioSummaryDto
        {
            Id = int.TryParse(subject, out var id) ? id : 0,
            Username = username,
            Nombre = username,
            Rol = principal.FindFirstValue(ClaimTypes.Role) ?? string.Empty
        };
    }
}