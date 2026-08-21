using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class MonitoreoService : IMonitoreoService
{
    private readonly IWeatherRepository _repository;

    public MonitoreoService(IWeatherRepository repository) => _repository = repository;

    public async Task<string> RestartAsync(string username, int? userId)
    {
        await _repository.CreateBitacoraAsync(new Bitacora
        {
            UsuarioId = userId,
            Usuario = username,
            Accion = "REINICIAR_MONITOREO",
            Descripcion = "Se reinició el sistema de monitoreo."
        });
        return "Sistema de monitoreo reiniciado correctamente.";
    }
}