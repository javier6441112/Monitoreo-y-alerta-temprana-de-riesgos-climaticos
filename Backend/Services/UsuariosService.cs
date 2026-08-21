using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class UsuariosService : IUsuariosService
{
    private readonly IWeatherRepository _repository;

    public UsuariosService(IWeatherRepository repository) => _repository = repository;

    public Task<List<Usuario>> GetAllAsync() => _repository.GetUsuariosAsync();
}