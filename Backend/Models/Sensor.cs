namespace WeatherRisk.Api.Models;

public class Sensor
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Unidad { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
    public int ComunidadId { get; set; }
    public DateTime? FechaCreacion { get; set; } = DateTime.UtcNow;
    public decimal ValorActual { get; set; }
    public DateTime? UltimaLectura { get; set; }
}
