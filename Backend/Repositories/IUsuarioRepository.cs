using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Repositories;

public interface IUsuarioRepository
{
    Task<List<Usuario>> GetUsuariosAsync();
    Task<Usuario?> GetUsuarioByIdAsync(int id);
    Task<Usuario?> GetUsuarioByUsernameAsync(string username);
    Task<Usuario> CreateUsuarioAsync(Usuario usuario);
    Task<Usuario?> UpdateUsuarioAsync(int id, Usuario usuario);
    Task<bool> UpdateUltimoAccesoAsync(int usuarioId, DateTime ultimoAcceso);
    Task<Usuario?> SetUsuarioActivoAsync(int id, bool activo);
}
