namespace WeatherRisk.Api.DTOs.Lecturas;

public class LecturaDto
{
    public int Id { get; set; }
    public int SensorId { get; set; }
    public decimal Valor { get; set; }
    public DateTime FechaHora { get; set; }
}

public class CreateLecturaRequestDto
{
    public int SensorId { get; set; }
    public decimal Valor { get; set; }
}
