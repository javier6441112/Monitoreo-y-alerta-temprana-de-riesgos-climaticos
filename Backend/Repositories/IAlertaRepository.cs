using WeatherRisk.Api.DTOs.Historial;
using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Repositories;

public interface IAlertaRepository
{
    Task<List<Alerta>> GetAlertasAsync(bool? activas = null, DateTime? desde = null, DateTime? hasta = null, int? comunidadId = null, int? sensorId = null, string? fenomeno = null, string? nivel = null, string? estado = null);
    Task<Alerta?> GetAlertaByIdAsync(int id);
    Task<Alerta> CreateAlertaAsync(Alerta alerta);
    Task<Alerta?> CerrarAlertaAsync(int id);
    Task<Alerta?> SetAlertaStateAsync(int id, string estado);
    Task<List<HistorialEvento>> GetHistorialAsync();
    Task<HistorialEvento> CreateHistorialEventoAsync(HistorialEvento evento);
    Task<List<ConfiguracionAlerta>> GetConfiguracionAlertasAsync(string? tipoSensor = null, bool? activo = null);
    Task<ConfiguracionAlerta?> GetConfiguracionAlertaByIdAsync(int id);
    Task<ConfiguracionAlerta> CreateConfiguracionAlertaAsync(ConfiguracionAlerta config);
    Task<ConfiguracionAlerta?> UpdateConfiguracionAlertaAsync(int id, ConfiguracionAlerta config);
    Task<ConfiguracionAlerta?> SetConfiguracionAlertaStateAsync(int id, bool activo);
    Task<bool> DeleteConfiguracionAlertaAsync(int id);
    Task<List<HistorialDto>> GetFilteredHistorialAsync(HistorialFiltersDto filters);
}
