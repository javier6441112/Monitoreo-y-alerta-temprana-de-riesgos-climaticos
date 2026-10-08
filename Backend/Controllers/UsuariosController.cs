using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.DTOs.Usuarios;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN")]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly IUsuariosService _usuariosService;

    public UsuariosController(IUsuariosService usuariosService)
    {
        _usuariosService = usuariosService;
    }

    [HttpGet]
    public async Task<ActionResult<List<UsuarioDto>>> GetUsuarios(
        [FromQuery] string? buscar,
        [FromQuery] string? rol,
        [FromQuery] bool? activo)
    {
        var usuarios = await _usuariosService.GetAllAsync(buscar, rol, activo);
        return Ok(usuarios.Select(ToDto).ToList());
    }

    [HttpGet("roles")]
    public ActionResult<IReadOnlyList<string>> GetRolesDisponibles() =>
        Ok(new[] { "ADMIN", "OPERADOR", "CONSULTA" });

    [HttpGet("{id:int}")]
    public async Task<ActionResult<UsuarioDto>> GetById(int id)
    {
        var usuario = await _usuariosService.GetByIdAsync(id);
        return usuario is null ? NotFound() : Ok(ToDto(usuario));
    }

    [HttpPost]
    public async Task<ActionResult<UsuarioDto>> Create([FromBody] CreateUsuarioRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Trim().Length > 100)
            return BadRequest(new { status = 400, message = "El username es obligatorio y no puede superar 100 caracteres." });

        if (string.IsNullOrWhiteSpace(request.Nombre) || request.Nombre.Trim().Length > 200)
            return BadRequest(new { status = 400, message = "El nombre es obligatorio y no puede superar 200 caracteres." });

        if (string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { status = 400, message = "La contraseña es obligatoria." });

        var rol = request.Rol.Trim().ToUpperInvariant();
        if (rol is not ("ADMIN" or "OPERADOR" or "CONSULTA"))
            return BadRequest(new { status = 400, message = "El rol debe ser ADMIN, OPERADOR o CONSULTA." });

        request.Rol = rol;

        try
        {
            var usuario = await _usuariosService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = usuario.Id }, ToDto(usuario));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { status = 409, message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<UsuarioDto>> Update(int id, [FromBody] UpdateUsuarioRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Trim().Length > 100)
            return BadRequest(new { status = 400, message = "El username es obligatorio y no puede superar 100 caracteres." });

        if (string.IsNullOrWhiteSpace(request.Nombre) || request.Nombre.Trim().Length > 200)
            return BadRequest(new { status = 400, message = "El nombre es obligatorio y no puede superar 200 caracteres." });

        if (!string.IsNullOrWhiteSpace(request.Password) && request.Password.Length < 8)
            return BadRequest(new { status = 400, message = "La contraseña debe tener al menos 8 caracteres." });

        if (string.IsNullOrWhiteSpace(request.Rol))
            return BadRequest(new { status = 400, message = "El rol debe ser ADMIN, OPERADOR o CONSULTA." });

        var rol = request.Rol.Trim().ToUpperInvariant();
        if (rol is not ("ADMIN" or "OPERADOR" or "CONSULTA"))
            return BadRequest(new { status = 400, message = "El rol debe ser ADMIN, OPERADOR o CONSULTA." });

        request.Rol = rol;

        try
        {
            var usuario = await _usuariosService.UpdateAsync(id, request);
            return usuario is null ? NotFound() : Ok(ToDto(usuario));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { status = 409, message = ex.Message });
        }
    }

    [HttpPatch("{id:int}/estado")]
    public async Task<ActionResult<UsuarioDto>> SetActive(int id, [FromBody] UpdateUsuarioEstadoRequestDto request)
    {
        var usuario = await _usuariosService.SetActiveAsync(id, request.Activo);
        return usuario is null ? NotFound() : Ok(ToDto(usuario));
    }

    private static UsuarioDto ToDto(WeatherRisk.Api.Models.Usuario usuario) => new()
    {
        Id = usuario.Id,
        Username = usuario.Username,
        Nombre = usuario.Nombre,
        Rol = usuario.Rol,
        Activo = usuario.Activo,
        FechaCreacion = usuario.FechaCreacion,
        UltimoAcceso = usuario.UltimoAcceso
    };
}
