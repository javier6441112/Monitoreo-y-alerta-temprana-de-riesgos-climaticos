using WeatherRisk.Api.DTOs.Alertas;

namespace WeatherRisk.Api.Services;

public interface IAlertasService
{
    Task<List<AlertaDto>> GetAllAsync(bool? activas, DateTime? desde = null, DateTime? hasta = null, int? comunidadId = null, int? sensorId = null, string? fenomeno = null, string? nivel = null, string? estado = null);
    Task<AlertaDto?> SetStateAsync(int id, string estado);
    Task<AlertaDto?> CloseAsync(int id);
}