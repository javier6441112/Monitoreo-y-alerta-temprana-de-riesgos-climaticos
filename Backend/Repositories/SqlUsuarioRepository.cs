using Microsoft.EntityFrameworkCore;
using WeatherRisk.Api.Data;
using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Repositories;

public sealed class SqlUsuarioRepository : IUsuarioRepository
{
    private readonly WeatherDbContext _context;

    public SqlUsuarioRepository(WeatherDbContext context) => _context = context;

    public async Task<List<Usuario>> GetUsuariosAsync() => await _context.Usuarios.ToListAsync();

    public async Task<Usuario?> GetUsuarioByIdAsync(int id) =>
        await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);

    public async Task<Usuario?> GetUsuarioByUsernameAsync(string username) =>
        await _context.Usuarios.FirstOrDefaultAsync(u => u.Username == username);

    public async Task<Usuario> CreateUsuarioAsync(Usuario usuario)
    {
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();
        return usuario;
    }

    public async Task<Usuario?> UpdateUsuarioAsync(int id, Usuario usuario)
    {
        var existing = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (existing is null)
            return null;

        existing.Username = usuario.Username;
        existing.Nombre = usuario.Nombre;
        existing.Rol = usuario.Rol;
        existing.Activo = usuario.Activo;
        if (!string.IsNullOrWhiteSpace(usuario.PasswordHash))
            existing.PasswordHash = usuario.PasswordHash;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> UpdateUltimoAccesoAsync(int usuarioId, DateTime ultimoAcceso)
    {
        var usuario = await _context.Usuarios.FindAsync(usuarioId);
        if (usuario is null)
            return false;

        usuario.UltimoAcceso = ultimoAcceso;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<Usuario?> SetUsuarioActivoAsync(int id, bool activo)
    {
        var existing = await _context.Usuarios.FirstOrDefaultAsync(u => u.Id == id);
        if (existing is null)
            return null;

        existing.Activo = activo;
        await _context.SaveChangesAsync();
        return existing;
    }
}
