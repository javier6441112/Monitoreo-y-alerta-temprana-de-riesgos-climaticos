using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.DTOs;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/comunidades")]
public class ComunidadesController : ControllerBase
{
    private readonly IComunidadService _service;
    public ComunidadesController(IComunidadService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ComunidadDto>>> GetAll([FromQuery] string? buscar, [FromQuery] bool? activo, [FromQuery] string? municipio, [FromQuery] string? departamento) => Ok(await _service.GetAllAsync(buscar, activo, municipio, departamento));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ComunidadDto>> GetById(int id)
    {
        var comunidad = await _service.GetByIdAsync(id);
        return comunidad is null ? NotFound(new { status = 404, title = "Comunidad no encontrada" }) : Ok(comunidad);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ComunidadDto>> Create([FromBody] CreateComunidadRequestDto request)
    {
        var comunidad = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = comunidad.Id }, comunidad);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ComunidadDto>> Update(int id, [FromBody] UpdateComunidadRequestDto request)
    {
        var comunidad = await _service.UpdateAsync(id, request);
        return comunidad is null ? NotFound(new { status = 404, title = "Comunidad no encontrada" }) : Ok(comunidad);
    }

    [HttpPatch("{id:int}/estado")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult> UpdateState(int id, [FromBody] UpdateComunidadEstadoRequestDto request)
    {
        return await _service.UpdateStateAsync(id, request.Activo) ? NoContent() : NotFound(new { status = 404, title = "Comunidad no encontrada" });
    }
}
