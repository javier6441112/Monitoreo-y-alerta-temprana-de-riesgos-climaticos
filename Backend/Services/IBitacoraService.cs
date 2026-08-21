using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Services;

public interface IBitacoraService
{
    Task<List<Bitacora>> GetAllAsync();
}