using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class HistorialService : IHistorialService
{
    private readonly IWeatherRepository _repository;

    public HistorialService(IWeatherRepository repository) => _repository = repository;

    public Task<List<HistorialEvento>> GetAllAsync() => _repository.GetHistorialAsync();
}