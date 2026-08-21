namespace WeatherRisk.Api.DTOs.Alertas;

public class AlertaDto
{
    public int Id { get; set; }
    public string Nivel { get; set; } = string.Empty;
    public string Fenomeno { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public int SensorId { get; set; }
    public decimal ValorDetectado { get; set; }
    public DateTime FechaHora { get; set; }
    public bool Activa { get; set; }
}
