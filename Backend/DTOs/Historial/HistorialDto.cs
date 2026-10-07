namespace WeatherRisk.Api.DTOs.Historial;

public class HistorialDto
{
    public int Id { get; set; }
    public DateTime FechaHora { get; set; }
    public int ComunidadId { get; set; }
    public int SensorId { get; set; }
    public string SensorNombre { get; set; } = string.Empty;
    public int? AlertaId { get; set; }
    public string Fenomeno { get; set; } = string.Empty;
    public string Nivel { get; set; } = string.Empty;
    public decimal? Valor { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public int? ResponsableId { get; set; }
    public string ResponsableNombre { get; set; } = string.Empty;
}
