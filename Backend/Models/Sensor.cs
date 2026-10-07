namespace WeatherRisk.Api.Models;

public class Sensor
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Unidad { get; set; } = string.Empty;
    public int ComunidadId { get; set; }
    public Comunidad? Comunidad { get; set; }
    public decimal? Latitud { get; set; }
    public decimal? Longitud { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime? FechaInstalacion { get; set; }
    public string? Descripcion { get; set; }
    public DateTime? FechaCreacion { get; set; } = DateTime.UtcNow;
    public decimal ValorActual { get; set; }
    public DateTime? UltimaLectura { get; set; }
}
