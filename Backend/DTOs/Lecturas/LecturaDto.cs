namespace WeatherRisk.Api.DTOs.Lecturas;

public class LecturaDto
{
    public int Id { get; set; }
    public int SensorId { get; set; }
    public string SensorNombre { get; set; } = string.Empty;
    public int ComunidadId { get; set; }
    public DateTime FechaHora { get; set; }
    public decimal Valor { get; set; }
    public string Unidad { get; set; } = string.Empty;
    public string EstadoSensor { get; set; } = string.Empty;
}

public class CreateLecturaRequestDto
{
    public int SensorId { get; set; }
    public decimal Valor { get; set; }
}
