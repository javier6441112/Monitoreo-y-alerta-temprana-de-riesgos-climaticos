using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeatherRisk.Api.Models;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class BitacoraController : ControllerBase
{
    private readonly IBitacoraService _bitacoraService;

    public BitacoraController(IBitacoraService bitacoraService)
    {
        _bitacoraService = bitacoraService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Bitacora>>> GetAll()
    {
        var bitacora = await _bitacoraService.GetAllAsync();
        return Ok(bitacora);
    }
}
