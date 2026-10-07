using WeatherRisk.Api.DTOs;
using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Services;

public interface IComunidadService
{
    Task<List<ComunidadDto>> GetAllAsync(string? buscar, bool? activo, string? municipio, string? departamento);
    Task<ComunidadDto?> GetByIdAsync(int id);
    Task<ComunidadDto> CreateAsync(CreateComunidadRequestDto request);
    Task<ComunidadDto?> UpdateAsync(int id, UpdateComunidadRequestDto request);
    Task<bool> UpdateStateAsync(int id, bool activo);
}
