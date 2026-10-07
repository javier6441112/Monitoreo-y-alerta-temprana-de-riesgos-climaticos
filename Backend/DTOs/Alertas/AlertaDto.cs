namespace WeatherRisk.Api.DTOs.Alertas;

public class AlertaDto
{
    public int Id { get; set; }
    public DateTime FechaHora { get; set; }
    public int ComunidadId { get; set; }
    public string ComunidadNombre { get; set; } = string.Empty;
    public int SensorId { get; set; }
    public string SensorNombre { get; set; } = string.Empty;
    public int? ConfiguracionAlertaId { get; set; }
    public string Fenomeno { get; set; } = string.Empty;
    public string Nivel { get; set; } = string.Empty;
    public decimal ValorDetectado { get; set; }
    public decimal? ValorMinimo { get; set; }
    public decimal? ValorMaximo { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public string Estado { get; set; } = "ACTIVA";
    public bool Activa
    {
        get => Estado == "ACTIVA";
        set => Estado = value ? "ACTIVA" : "CERRADA";
    }
    public int? AtendidaPorId { get; set; }
    public string? AtendidaPorNombre { get; set; }
    public DateTime? FechaAtencion { get; set; }
    public int? CerradaPorId { get; set; }
    public string? CerradaPorNombre { get; set; }
    public DateTime? FechaCierre { get; set; }
}

public class ChangeAlertStateRequestDto
{
    public string Estado { get; set; } = string.Empty;
}
