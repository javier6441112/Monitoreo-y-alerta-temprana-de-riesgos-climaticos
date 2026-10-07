namespace WeatherRisk.Api.Models;

public class RevokedToken
{
    public string TokenId { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
}