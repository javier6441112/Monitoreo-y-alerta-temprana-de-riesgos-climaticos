using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Repositories;

public interface IComunidadRepository
{
    Task<List<Comunidad>> GetComunidadesAsync(string? buscar, bool? activo, string? municipio, string? departamento);
    Task<Comunidad?> GetComunidadByIdAsync(int id);
    Task<Comunidad> CreateComunidadAsync(Comunidad comunidad);
    Task<Comunidad?> UpdateComunidadAsync(int id, Comunidad comunidad);
    Task<bool> SetComunidadActivaAsync(int id, bool activo);
}
