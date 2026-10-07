using WeatherRisk.Api.DTOs.Lecturas;

namespace WeatherRisk.Api.Services;

public interface ILecturasService
{
    Task<List<LecturaDto>> GetAllAsync(int? sensorId, int? comunidadId, DateTime? desde, DateTime? hasta);
    Task<LecturaDto> CreateAsync(CreateLecturaRequestDto request);
}