namespace WeatherRisk.Api.DTOs.Historial;

public class HistorialFiltersDto
{
    public DateTime? Desde { get; set; }
    public DateTime? Hasta { get; set; }
    public int? ComunidadId { get; set; }
    public int? SensorId { get; set; }
    public string? Fenomeno { get; set; }
    public string? Nivel { get; set; }
}

public class EstadisticasHistorialDto
{
    public int TotalEventos { get; set; }
    public Dictionary<string, int> PorNivel { get; set; } = new();
    public Dictionary<string, int> PorFenomeno { get; set; } = new();
}
