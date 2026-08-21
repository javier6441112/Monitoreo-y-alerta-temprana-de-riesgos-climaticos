using WeatherRisk.Api.DTOs.Alertas;
using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class ConfiguracionAlertaService : IConfiguracionAlertaService
{
    private readonly IWeatherRepository _repository;

    public ConfiguracionAlertaService(IWeatherRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<ConfiguracionAlertaDto>> GetAllAsync(string? tipoSensor = null) =>
        (await _repository.GetConfiguracionAlertasAsync(tipoSensor)).Select(Map).ToList();

    public async Task<ConfiguracionAlertaDto?> GetByIdAsync(int id)
    {
        var config = await _repository.GetConfiguracionAlertaByIdAsync(id);
        return config is null ? null : Map(config);
    }

    public async Task<ConfiguracionAlertaDto> CreateAsync(CreateConfiguracionAlertaRequestDto request)
    {
        var config = await _repository.CreateConfiguracionAlertaAsync(new ConfiguracionAlerta
        {
            TipoSensor = request.TipoSensor,
            Nivel = request.Nivel,
            ValorMinimo = request.ValorMinimo,
            Fenomeno = request.Fenomeno,
            Mensaje = request.Mensaje,
            Activo = request.Activo
        });

        return Map(config);
    }

    public async Task<ConfiguracionAlertaDto?> UpdateAsync(int id, UpdateConfiguracionAlertaRequestDto request)
    {
        var updated = await _repository.UpdateConfiguracionAlertaAsync(id, new ConfiguracionAlerta
        {
            TipoSensor = request.TipoSensor,
            Nivel = request.Nivel,
            ValorMinimo = request.ValorMinimo,
            Fenomeno = request.Fenomeno,
            Mensaje = request.Mensaje,
            Activo = request.Activo
        });

        return updated is null ? null : Map(updated);
    }

    public Task<bool> DeleteAsync(int id) => _repository.DeleteConfiguracionAlertaAsync(id);

    private static ConfiguracionAlertaDto Map(ConfiguracionAlerta config) => new()
    {
        Id = config.Id,
        TipoSensor = config.TipoSensor,
        Nivel = config.Nivel,
        ValorMinimo = config.ValorMinimo,
        Fenomeno = config.Fenomeno,
        Mensaje = config.Mensaje,
        Activo = config.Activo
    };
}
