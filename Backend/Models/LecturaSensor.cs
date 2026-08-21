namespace WeatherRisk.Api.Models;

public class LecturaSensor
{
    public int Id { get; set; }
    public int SensorId { get; set; }
    public decimal Valor { get; set; }
    public DateTime FechaHora { get; set; } = DateTime.UtcNow;
}
