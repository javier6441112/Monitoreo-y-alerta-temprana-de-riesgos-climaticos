namespace WeatherRisk.Api.DTOs;

public class EstadisticasHistorialDto
{
    public int TotalEventos { get; set; }
    public Dictionary<string, int> PorFenomeno { get; set; } = new();
    public Dictionary<string, int> PorNivel { get; set; } = new();
    public IReadOnlyList<SeriesPointDto> PorPeriodo { get; set; } = Array.Empty<SeriesPointDto>();
}
