namespace WeatherRisk.Api.Models;

public class HistorialEvento
{
    public int Id { get; set; }
    public int? AlertaId { get; set; }
    public int SensorId { get; set; }
    public string Fenomeno { get; set; } = string.Empty;
    public string Nivel { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public DateTime FechaHora { get; set; } = DateTime.UtcNow;
}
