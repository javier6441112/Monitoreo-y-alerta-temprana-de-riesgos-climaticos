namespace WeatherRisk.Api.Models;

public class Comunidad
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Municipio { get; set; } = string.Empty;
    public string Departamento { get; set; } = string.Empty;
    public string Pais { get; set; } = string.Empty;
    public decimal? Latitud { get; set; }
    public decimal? Longitud { get; set; }
    public string? Descripcion { get; set; }
    public bool Activo { get; set; } = true;
    public ICollection<Sensor> Sensores { get; set; } = new List<Sensor>();
}
