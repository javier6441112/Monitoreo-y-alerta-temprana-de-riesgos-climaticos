using WeatherRisk.Api.DTOs.Bitacora;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class BitacoraService : IBitacoraService
{
    private readonly IWeatherRepository _repository;

    public BitacoraService(IWeatherRepository repository) => _repository = repository;

    public async Task<List<BitacoraDto>> GetAllAsync(DateTime? desde = null, DateTime? hasta = null, int? usuarioId = null, string? accion = null, string? entidad = null)
    {
        var registros = await _repository.GetBitacoraAsync(desde, hasta, usuarioId, accion, entidad);
        return registros.Select(Map).ToList();
    }

    private static BitacoraDto Map(Models.Bitacora registro) => new()
    {
        Id = registro.Id,
        UsuarioId = registro.UsuarioId,
        UsuarioNombre = registro.Usuario,
        Accion = registro.Accion,
        Entidad = registro.Descripcion,
        Descripcion = registro.Descripcion,
        FechaHora = registro.FechaHora
    };
}