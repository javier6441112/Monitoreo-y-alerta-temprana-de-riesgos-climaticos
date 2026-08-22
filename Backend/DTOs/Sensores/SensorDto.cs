namespace WeatherRisk.Api.DTOs.Sensores;

public class SensorDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Unidad { get; set; } = string.Empty;
    public decimal ValorActual { get; set; }
    public bool Activo { get; set; }
    public int ComunidadId { get; set; }
    public DateTime? UltimaLectura { get; set; }
}

public class CreateSensorRequestDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Unidad { get; set; } = string.Empty;
    public int ComunidadId { get; set; } = 1;
}

public class UpdateSensorRequestDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Unidad { get; set; } = string.Empty;
    public int ComunidadId { get; set; } = 1;
    public bool? Activo { get; set; }
}

public class UpdateSensorEstadoRequestDto
{
    public bool Activo { get; set; }
}
