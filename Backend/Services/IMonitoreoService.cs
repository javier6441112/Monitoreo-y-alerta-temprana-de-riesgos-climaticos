namespace WeatherRisk.Api.Services;

public interface IMonitoreoService
{
    Task<string> RestartAsync(string username, int? userId);
}