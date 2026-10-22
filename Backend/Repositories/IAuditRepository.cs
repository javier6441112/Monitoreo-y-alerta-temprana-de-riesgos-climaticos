using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Repositories;

public interface IAuditRepository
{
    Task<List<Bitacora>> GetBitacoraAsync(DateTime? desde = null, DateTime? hasta = null, int? usuarioId = null, string? accion = null, string? entidad = null);
    Task<Bitacora> CreateBitacoraAsync(Bitacora bitacora);
}
