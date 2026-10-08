using WeatherRisk.Api.DTOs.Bitacora;

namespace WeatherRisk.Api.Services;

public interface IBitacoraService
{
    Task<List<BitacoraDto>> GetAllAsync(DateTime? desde = null, DateTime? hasta = null, int? usuarioId = null, string? accion = null, string? entidad = null);
}