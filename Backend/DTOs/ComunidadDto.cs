namespace WeatherRisk.Api.DTOs;

public class ComunidadDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Municipio { get; set; } = string.Empty;
    public string Departamento { get; set; } = string.Empty;
    public string Pais { get; set; } = string.Empty;
    public decimal? Latitud { get; set; }
    public decimal? Longitud { get; set; }
    public string? Descripcion { get; set; }
    public bool Activo { get; set; }
    public int SensoresActivos { get; set; }
    public int SensoresTotales { get; set; }
}

public class CreateComunidadRequestDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Municipio { get; set; } = string.Empty;
    public string Departamento { get; set; } = string.Empty;
    public string Pais { get; set; } = string.Empty;
    public decimal? Latitud { get; set; }
    public decimal? Longitud { get; set; }
    public string? Descripcion { get; set; }
    public bool Activo { get; set; } = true;
}

public class UpdateComunidadRequestDto : CreateComunidadRequestDto
{
}

public class UpdateComunidadEstadoRequestDto
{
    public bool Activo { get; set; }
}
