namespace WeatherRisk.Api.Models;

public class Alerta
{
    public int Id { get; set; }
    public int SensorId { get; set; }
    public string Nivel { get; set; } = "VERDE";
    public string Fenomeno { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public decimal ValorDetectado { get; set; }
    public DateTime FechaHora { get; set; } = DateTime.UtcNow;
    public bool Activa { get; set; } = true;
}
