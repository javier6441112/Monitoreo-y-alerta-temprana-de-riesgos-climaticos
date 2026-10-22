using Microsoft.EntityFrameworkCore;
using WeatherRisk.Api.Data;
using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Repositories;

public sealed class SqlComunidadRepository : IComunidadRepository
{
    private readonly WeatherDbContext _context;

    public SqlComunidadRepository(WeatherDbContext context) => _context = context;

    public async Task<List<Comunidad>> GetComunidadesAsync(string? buscar, bool? activo, string? municipio, string? departamento)
    {
        var query = _context.Comunidades.AsQueryable();
        if (!string.IsNullOrWhiteSpace(buscar))
            query = query.Where(c => c.Nombre.Contains(buscar) || c.Municipio.Contains(buscar));
        if (activo.HasValue) query = query.Where(c => c.Activo == activo.Value);
        if (!string.IsNullOrWhiteSpace(municipio)) query = query.Where(c => c.Municipio.Contains(municipio));
        if (!string.IsNullOrWhiteSpace(departamento)) query = query.Where(c => c.Departamento.Contains(departamento));
        return await query.ToListAsync();
    }

    public Task<Comunidad?> GetComunidadByIdAsync(int id) =>
        _context.Comunidades.FirstOrDefaultAsync(c => c.Id == id);

    public async Task<Comunidad> CreateComunidadAsync(Comunidad comunidad)
    {
        _context.Comunidades.Add(comunidad);
        await _context.SaveChangesAsync();
        return comunidad;
    }

    public async Task<Comunidad?> UpdateComunidadAsync(int id, Comunidad comunidad)
    {
        var existing = await _context.Comunidades.FirstOrDefaultAsync(c => c.Id == id);
        if (existing is null) return null;
        existing.Nombre = comunidad.Nombre;
        existing.Municipio = comunidad.Municipio;
        existing.Departamento = comunidad.Departamento;
        existing.Pais = comunidad.Pais;
        existing.Latitud = comunidad.Latitud;
        existing.Longitud = comunidad.Longitud;
        existing.Descripcion = comunidad.Descripcion;
        existing.Activo = comunidad.Activo;
        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> SetComunidadActivaAsync(int id, bool activo)
    {
        var comunidad = await _context.Comunidades.FirstOrDefaultAsync(c => c.Id == id);
        if (comunidad is null) return false;
        comunidad.Activo = activo;
        await _context.SaveChangesAsync();
        return true;
    }
}
