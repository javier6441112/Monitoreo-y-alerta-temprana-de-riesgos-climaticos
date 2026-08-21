using WeatherRisk.Api.DTOs.Lecturas;

namespace WeatherRisk.Api.Services;

public interface ILecturasService
{
    Task<List<LecturaDto>> GetAllAsync(int? sensorId, DateTime? fechaInicio, DateTime? fechaFin);
    Task<LecturaDto> CreateAsync(CreateLecturaRequestDto request);
}