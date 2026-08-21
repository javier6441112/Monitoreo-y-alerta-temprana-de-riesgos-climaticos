using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Services;

public interface IHistorialService
{
    Task<List<HistorialEvento>> GetAllAsync();
}