using WeatherRisk.Api.DTOs.Dashboard;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class DashboardService : IDashboardService
{
    private readonly IWeatherRepository _repository;

    public DashboardService(IWeatherRepository repository) => _repository = repository;

    public async Task<DashboardDto> GetAsync()
    {
        var snapshot = await _repository.GetDashboardSnapshotAsync();
        return new DashboardDto
        {
            Temperatura = new() { Valor = snapshot.Temperatura, Unidad = "°C" },
            Humedad = new() { Valor = snapshot.Humedad, Unidad = "%" },
            Viento = new() { Valor = snapshot.Viento, Unidad = "km/h" },
            Lluvia = new() { Valor = snapshot.Lluvia, Unidad = "mm/h" },
            NivelRio = new() { Valor = snapshot.NivelRio, Unidad = "m" },
            NivelGeneral = snapshot.NivelGeneral,
            AlertasActivas = snapshot.AlertasActivas,
            SensoresActivos = snapshot.SensoresActivos,
            SensoresTotales = snapshot.SensoresTotales
        };
    }
}