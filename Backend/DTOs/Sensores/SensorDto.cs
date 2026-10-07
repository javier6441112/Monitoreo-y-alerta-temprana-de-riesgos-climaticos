namespace WeatherRisk.Api.DTOs.Sensores;

public class SensorDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Unidad { get; set; } = string.Empty;
    public int ComunidadId { get; set; }
    public string? ComunidadNombre { get; set; }
    public decimal? Latitud { get; set; }
    public decimal? Longitud { get; set; }
    public bool Activo { get; set; }
    public DateTime? FechaInstalacion { get; set; }
    public string? Descripcion { get; set; }
    public decimal ValorActual { get; set; }
    public DateTime? UltimaLectura { get; set; }
}

public class CreateSensorRequestDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Unidad { get; set; } = string.Empty;
    public int ComunidadId { get; set; }
    public decimal? Latitud { get; set; }
    public decimal? Longitud { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime? FechaInstalacion { get; set; }
    public string? Descripcion { get; set; }
}

public class UpdateSensorRequestDto : CreateSensorRequestDto
{
    public new bool? Activo { get; set; }
}

public class UpdateSensorEstadoRequestDto
{
    public bool Activo { get; set; }
}
