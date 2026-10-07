namespace WeatherRisk.Api.DTOs.Dashboard;

public class DashboardFiltersDto
{
    public int? ComunidadId { get; set; }
    public DateTime? Desde { get; set; }
    public DateTime? Hasta { get; set; }
}
