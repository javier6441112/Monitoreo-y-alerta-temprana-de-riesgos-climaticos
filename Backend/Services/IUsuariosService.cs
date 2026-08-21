using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Services;

public interface IUsuariosService
{
    Task<List<Usuario>> GetAllAsync();
}