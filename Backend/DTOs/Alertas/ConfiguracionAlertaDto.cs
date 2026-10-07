namespace WeatherRisk.Api.DTOs.Alertas;

public class ConfiguracionAlertaDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string TipoSensor { get; set; } = string.Empty;
    public decimal? ValorMinimo { get; set; }
    public decimal? ValorMaximo { get; set; }
    public string Nivel { get; set; } = string.Empty;
    public string Fenomeno { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public bool Activo { get; set; }
}

public class CreateConfiguracionAlertaRequestDto
{
    public string Nombre { get; set; } = string.Empty;
    public string TipoSensor { get; set; } = string.Empty;
    public decimal? ValorMinimo { get; set; }
    public decimal? ValorMaximo { get; set; }
    public string Nivel { get; set; } = string.Empty;
    public string Fenomeno { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}

public class UpdateConfiguracionAlertaRequestDto : CreateConfiguracionAlertaRequestDto
{
}

public class UpdateConfiguracionAlertaEstadoRequestDto
{
    public bool Activo { get; set; }
}
