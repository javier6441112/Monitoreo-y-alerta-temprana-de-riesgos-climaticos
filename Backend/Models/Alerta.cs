namespace WeatherRisk.Api.Models;

public class Alerta
{
    public int Id { get; set; }
    public int SensorId { get; set; }
    public Sensor? Sensor { get; set; }
    public int? ConfiguracionAlertaId { get; set; }
    public ConfiguracionAlerta? ConfiguracionAlerta { get; set; }
    public string Nivel { get; set; } = "VERDE";
    public string Fenomeno { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public decimal ValorDetectado { get; set; }
    public decimal? ValorMinimo { get; set; }
    public decimal? ValorMaximo { get; set; }
    public string Estado { get; set; } = "ACTIVA";
    public bool Activa
    {
        get => Estado == "ACTIVA";
        set => Estado = value ? "ACTIVA" : "CERRADA";
    }
    public int? AtendidaPorId { get; set; }
    public Usuario? AtendidaPor { get; set; }
    public DateTime? FechaAtencion { get; set; }
    public int? CerradaPorId { get; set; }
    public Usuario? CerradaPor { get; set; }
    public DateTime? FechaCierre { get; set; }
    public DateTime FechaHora { get; set; } = DateTime.UtcNow;
}
