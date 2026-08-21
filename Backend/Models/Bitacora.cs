namespace WeatherRisk.Api.Models;

public class Bitacora
{
    public int Id { get; set; }
    public int? UsuarioId { get; set; }
    public string Usuario { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public DateTime FechaHora { get; set; } = DateTime.UtcNow;
}
