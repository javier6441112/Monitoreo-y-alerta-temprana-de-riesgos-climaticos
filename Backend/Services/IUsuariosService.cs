using WeatherRisk.Api.Models;
using WeatherRisk.Api.DTOs.Usuarios;

namespace WeatherRisk.Api.Services;

public interface IUsuariosService
{
    Task<List<Usuario>> GetAllAsync();
    Task<Usuario?> GetByIdAsync(int id);
    Task<Usuario> CreateAsync(CreateUsuarioRequestDto request);
}