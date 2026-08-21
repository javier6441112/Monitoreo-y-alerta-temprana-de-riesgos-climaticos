using WeatherRisk.Api.DTOs.Alertas;

namespace WeatherRisk.Api.Services;

public interface IAlertasService
{
    Task<List<AlertaDto>> GetAllAsync(bool? activas);
    Task<AlertaDto?> CloseAsync(int id);
}