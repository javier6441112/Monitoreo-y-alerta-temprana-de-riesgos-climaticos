using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;
using WeatherRisk.Api.DTOs.Usuarios;

namespace WeatherRisk.Api.Services;

public sealed class UsuariosService : IUsuariosService
{
    private readonly IWeatherRepository _repository;

    public UsuariosService(IWeatherRepository repository) => _repository = repository;

    public async Task<List<Usuario>> GetAllAsync(string? buscar = null, string? rol = null, bool? activo = null)
    {
        var usuarios = await _repository.GetUsuariosAsync();
        var texto = buscar?.Trim();
        var rolNormalizado = rol?.Trim().ToUpperInvariant();

        return usuarios.Where(usuario =>
                (string.IsNullOrWhiteSpace(texto) ||
                 usuario.Nombre.Contains(texto, StringComparison.OrdinalIgnoreCase) ||
                 usuario.Username.Contains(texto, StringComparison.OrdinalIgnoreCase)) &&
                (string.IsNullOrWhiteSpace(rolNormalizado) || usuario.Rol.Equals(rolNormalizado, StringComparison.OrdinalIgnoreCase)) &&
                (!activo.HasValue || usuario.Activo == activo.Value))
            .ToList();
    }

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

    public async Task<Usuario?> UpdateAsync(int id, UpdateUsuarioRequestDto request)
    {
        var existing = await _repository.GetUsuarioByIdAsync(id);
        if (existing is null)
            return null;

        var username = request.Username.Trim();
        var duplicate = await _repository.GetUsuarioByUsernameAsync(username);
        if (duplicate is not null && duplicate.Id != id)
            throw new InvalidOperationException("El username ya está registrado.");

        return await _repository.UpdateUsuarioAsync(id, new Usuario
        {
            Username = username,
            Nombre = request.Nombre.Trim(),
            Rol = request.Rol.Trim().ToUpperInvariant(),
            Activo = request.Activo,
            PasswordHash = string.IsNullOrWhiteSpace(request.Password)
                ? string.Empty
                : PasswordHasher.Hash(request.Password)
        });
    }

    public Task<Usuario?> SetActiveAsync(int id, bool activo) =>
        _repository.SetUsuarioActivoAsync(id, activo);
}