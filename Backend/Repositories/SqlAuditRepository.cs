using Microsoft.EntityFrameworkCore;
using WeatherRisk.Api.Data;
using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Repositories;

public sealed class SqlAuditRepository : IAuditRepository
{
    private readonly WeatherDbContext _context;

    public SqlAuditRepository(WeatherDbContext context) => _context = context;

    public async Task<List<Bitacora>> GetBitacoraAsync(DateTime? desde = null, DateTime? hasta = null, int? usuarioId = null, string? accion = null, string? entidad = null)
    {
        var query = _context.Bitacora.AsQueryable();
        if (desde.HasValue) query = query.Where(b => b.FechaHora >= desde.Value);
        if (hasta.HasValue) query = query.Where(b => b.FechaHora <= hasta.Value);
        if (usuarioId.HasValue) query = query.Where(b => b.UsuarioId == usuarioId.Value);
        if (!string.IsNullOrWhiteSpace(accion)) query = query.Where(b => b.Accion.Contains(accion));
        if (!string.IsNullOrWhiteSpace(entidad)) query = query.Where(b => b.Descripcion.Contains(entidad));
        return await query.OrderByDescending(b => b.FechaHora).ToListAsync();
    }

    public async Task<Bitacora> CreateBitacoraAsync(Bitacora bitacora)
    {
        _context.Bitacora.Add(bitacora);
        await _context.SaveChangesAsync();
        return bitacora;
    }
}
