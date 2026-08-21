namespace WeatherRisk.Api.DTOs.Alertas;

public class ConfiguracionAlertaDto
{
    public int Id { get; set; }
    public string TipoSensor { get; set; } = string.Empty;
    public string Nivel { get; set; } = string.Empty;
    public decimal ValorMinimo { get; set; }
    public string Fenomeno { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public bool Activo { get; set; }
}

public class CreateConfiguracionAlertaRequestDto
{
    public string TipoSensor { get; set; } = string.Empty;
    public string Nivel { get; set; } = string.Empty;
    public decimal ValorMinimo { get; set; }
    public string Fenomeno { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}

public class UpdateConfiguracionAlertaRequestDto
{
    public string TipoSensor { get; set; } = string.Empty;
    public string Nivel { get; set; } = string.Empty;
    public decimal ValorMinimo { get; set; }
    public string Fenomeno { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}
