using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;
using WeatherRisk.Api.DTOs.Usuarios;

namespace WeatherRisk.Api.Services;

public sealed class UsuariosService : IUsuariosService
{
    private readonly IWeatherRepository _repository;

    public UsuariosService(IWeatherRepository repository) => _repository = repository;

    public Task<List<Usuario>> GetAllAsync() => _repository.GetUsuariosAsync();

    public Task<Usuario?> GetByIdAsync(int id) => _repository.GetUsuarioByIdAsync(id);

    public async Task<Usuario> CreateAsync(CreateUsuarioRequestDto request)
    {
        var username = request.Username.Trim();
        if (await _repository.GetUsuarioByUsernameAsync(username) is not null)
            throw new InvalidOperationException("El username ya está registrado.");

        return await _repository.CreateUsuarioAsync(new Usuario
        {
            Username = username,
            PasswordHash = PasswordHasher.Hash(request.Password),
            Nombre = request.Nombre.Trim(),
            Rol = request.Rol.Trim().ToUpperInvariant(),
            Activo = request.Activo,
            FechaCreacion = DateTime.UtcNow
        });
    }
}