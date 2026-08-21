namespace WeatherRisk.Api.DTOs.Auth;

public class LoginRequestDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(8);
    public UsuarioSummaryDto User { get; set; } = new();
}

public class UsuarioSummaryDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
}
