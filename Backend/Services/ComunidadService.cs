using WeatherRisk.Api.Repositories;
using WeatherRisk.Api.DTOs;

namespace WeatherRisk.Api.Services;

public sealed class ComunidadService : IComunidadService
{
    private readonly IComunidadRepository _repository;

    public ComunidadService(IComunidadRepository repository) => _repository = repository;

    public async Task<List<ComunidadDto>> GetAllAsync(string? buscar, bool? activo, string? municipio, string? departamento)
    {
        var comunidades = await _repository.GetComunidadesAsync(buscar, activo, municipio, departamento);
        return comunidades.Select(Map).ToList();
    }

    public async Task<ComunidadDto?> GetByIdAsync(int id)
    {
        var comunidad = await _repository.GetComunidadByIdAsync(id);
        return comunidad is null ? null : Map(comunidad);
    }

    public async Task<ComunidadDto> CreateAsync(CreateComunidadRequestDto request)
    {
        var comunidad = new Models.Comunidad { Nombre = request.Nombre.Trim(), Municipio = request.Municipio.Trim(), Departamento = request.Departamento.Trim(), Pais = request.Pais.Trim(), Latitud = request.Latitud, Longitud = request.Longitud, Descripcion = request.Descripcion, Activo = request.Activo };
        var created = await _repository.CreateComunidadAsync(comunidad);
        return Map(created);
    }

    public async Task<ComunidadDto?> UpdateAsync(int id, UpdateComunidadRequestDto request)
    {
        var comunidad = await _repository.UpdateComunidadAsync(id, new Models.Comunidad
        {
            Nombre = request.Nombre.Trim(),
            Municipio = request.Municipio.Trim(),
            Departamento = request.Departamento.Trim(),
            Pais = request.Pais.Trim(),
            Latitud = request.Latitud,
            Longitud = request.Longitud,
            Descripcion = request.Descripcion,
            Activo = request.Activo
        });
        return comunidad is null ? null : Map(comunidad);
    }

    public Task<bool> UpdateStateAsync(int id, bool activo) =>
        _repository.SetComunidadActivaAsync(id, activo);

    private static ComunidadDto Map(Models.Comunidad comunidad) => new()
    {
        Id = comunidad.Id,
        Nombre = comunidad.Nombre,
        Municipio = comunidad.Municipio,
        Departamento = comunidad.Departamento,
        Pais = comunidad.Pais,
        Latitud = comunidad.Latitud,
        Longitud = comunidad.Longitud,
        Descripcion = comunidad.Descripcion,
        Activo = comunidad.Activo,
        SensoresActivos = comunidad.Sensores?.Count(s => s.Activo) ?? 0,
        SensoresTotales = comunidad.Sensores?.Count ?? 0
    };
}
