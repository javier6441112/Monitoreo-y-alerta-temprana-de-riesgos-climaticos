using Microsoft.EntityFrameworkCore;
using WeatherRisk.Api.Data;
using WeatherRisk.Api.DTOs;

namespace WeatherRisk.Api.Services;

public sealed class ComunidadService : IComunidadService
{
    private readonly WeatherDbContext _context;

    public ComunidadService(WeatherDbContext context) => _context = context;

    public async Task<List<ComunidadDto>> GetAllAsync(string? buscar, bool? activo, string? municipio, string? departamento)
    {
        var query = _context.Comunidades.AsQueryable();
        if (!string.IsNullOrWhiteSpace(buscar))
            query = query.Where(c => c.Nombre.Contains(buscar) || c.Municipio.Contains(buscar));
        if (activo.HasValue) query = query.Where(c => c.Activo == activo.Value);
        if (!string.IsNullOrWhiteSpace(municipio)) query = query.Where(c => c.Municipio.Contains(municipio));
        if (!string.IsNullOrWhiteSpace(departamento)) query = query.Where(c => c.Departamento.Contains(departamento));

        var comunidades = await query.ToListAsync();
        return comunidades.Select(Map).ToList();
    }

    public async Task<ComunidadDto?> GetByIdAsync(int id)
    {
        var comunidad = await _context.Comunidades.FirstOrDefaultAsync(c => c.Id == id);
        return comunidad is null ? null : Map(comunidad);
    }

    public async Task<ComunidadDto> CreateAsync(CreateComunidadRequestDto request)
    {
        var comunidad = new Models.Comunidad { Nombre = request.Nombre.Trim(), Municipio = request.Municipio.Trim(), Departamento = request.Departamento.Trim(), Pais = request.Pais.Trim(), Latitud = request.Latitud, Longitud = request.Longitud, Descripcion = request.Descripcion, Activo = request.Activo };
        _context.Comunidades.Add(comunidad);
        await _context.SaveChangesAsync();
        return Map(comunidad);
    }

    public async Task<ComunidadDto?> UpdateAsync(int id, UpdateComunidadRequestDto request)
    {
        var comunidad = await _context.Comunidades.FirstOrDefaultAsync(c => c.Id == id);
        if (comunidad is null) return null;
        comunidad.Nombre = request.Nombre.Trim();
        comunidad.Municipio = request.Municipio.Trim();
        comunidad.Departamento = request.Departamento.Trim();
        comunidad.Pais = request.Pais.Trim();
        comunidad.Latitud = request.Latitud;
        comunidad.Longitud = request.Longitud;
        comunidad.Descripcion = request.Descripcion;
        comunidad.Activo = request.Activo;
        await _context.SaveChangesAsync();
        return Map(comunidad);
    }

    public async Task<bool> UpdateStateAsync(int id, bool activo)
    {
        var comunidad = await _context.Comunidades.FirstOrDefaultAsync(c => c.Id == id);
        if (comunidad is null) return false;
        comunidad.Activo = activo;
        await _context.SaveChangesAsync();
        return true;
    }

    private static ComunidadDto Map(Models.Comunidad comunidad) => new()
    {
        Id = comunidad.Id,
        Nombre = comunidad.Nombre,
        Municipio = comunidad.Municipio,
        Departamento = comunidad.Departamento,
        Pais = comunidad.Pais,
        Latitud = comunidad.Latitud,
        Longitud = comunidad.Longitud,
        Descripcion = comunidad.Descripcion,
        Activo = comunidad.Activo,
        SensoresActivos = comunidad.Sensores?.Count(s => s.Activo) ?? 0,
        SensoresTotales = comunidad.Sensores?.Count ?? 0
    };
}
