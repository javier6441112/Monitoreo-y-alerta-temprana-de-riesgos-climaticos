using WeatherRisk.Api.DTOs.Historial;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class HistorialService : IHistorialService
{
    private readonly IWeatherRepository _repository;

    public HistorialService(IWeatherRepository repository) => _repository = repository;

    public Task<List<HistorialDto>> GetAllAsync(HistorialFiltersDto filters) =>
        _repository.GetFilteredHistorialAsync(filters);

    public async Task<EstadisticasHistorialDto> GetStatisticsAsync(HistorialFiltersDto filters)
    {
        var eventos = await _repository.GetFilteredHistorialAsync(filters);
        return new EstadisticasHistorialDto
        {
            TotalEventos = eventos.Count,
            PorNivel = eventos.GroupBy(e => e.Nivel).ToDictionary(g => g.Key, g => g.Count()),
            PorFenomeno = eventos.GroupBy(e => e.Fenomeno).ToDictionary(g => g.Key, g => g.Count())
        };
    }
}