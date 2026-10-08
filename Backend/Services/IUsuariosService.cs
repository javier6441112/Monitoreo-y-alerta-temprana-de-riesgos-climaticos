using WeatherRisk.Api.Models;
using WeatherRisk.Api.DTOs.Usuarios;

namespace WeatherRisk.Api.Services;

public interface IUsuariosService
{
    Task<List<Usuario>> GetAllAsync();
    Task<Usuario?> GetByIdAsync(int id);
    Task<Usuario> CreateAsync(CreateUsuarioRequestDto request);
    Task<Usuario?> UpdateAsync(int id, UpdateUsuarioRequestDto request);
    Task<Usuario?> SetActiveAsync(int id, bool activo);
}