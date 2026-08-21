using WeatherRisk.Api.DTOs.Alertas;
using WeatherRisk.Api.DTOs.Auth;
using WeatherRisk.Api.DTOs.Dashboard;
using WeatherRisk.Api.DTOs.Lecturas;
using WeatherRisk.Api.DTOs.Sensores;
using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Services;

public interface IWeatherService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    Task<UsuarioSummaryDto> GetCurrentUserAsync();
    Task<List<Usuario>> GetUsuariosAsync();
    Task<List<SensorDto>> GetSensoresAsync();
    Task<SensorDto?> GetSensorByIdAsync(int id);
    Task<SensorDto> CreateSensorAsync(CreateSensorRequestDto request);
    Task<SensorDto?> UpdateSensorAsync(int id, UpdateSensorRequestDto request);
    Task<bool> DeleteSensorAsync(int id);
    Task<List<LecturaDto>> GetLecturasAsync(int? sensorId, DateTime? fechaInicio, DateTime? fechaFin);
    Task<LecturaDto> CreateLecturaAsync(CreateLecturaRequestDto request);
    Task<List<AlertaDto>> GetAlertasAsync(bool? activas = null);
    Task<AlertaDto?> CerrarAlertaAsync(int id);
    Task<List<HistorialEvento>> GetHistorialAsync();
    Task<List<Bitacora>> GetBitacoraAsync();
    Task<DashboardDto> GetDashboardAsync();
    Task<string> ReiniciarMonitoreoAsync();
}
