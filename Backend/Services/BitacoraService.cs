using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class BitacoraService : IBitacoraService
{
    private readonly IWeatherRepository _repository;

    public BitacoraService(IWeatherRepository repository) => _repository = repository;

    public Task<List<Bitacora>> GetAllAsync() => _repository.GetBitacoraAsync();
}