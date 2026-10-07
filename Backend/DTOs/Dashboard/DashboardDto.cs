namespace WeatherRisk.Api.DTOs.Dashboard;

public class DashboardMetricDto
{
    public decimal Valor { get; set; }
    public string Unidad { get; set; } = string.Empty;
}

public class DashboardCommunityDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int SensoresActivos { get; set; }
    public int SensoresTotales { get; set; }
    public int AlertasActivas { get; set; }
}

public class DashboardSeriesPointDto
{
    public DateTime FechaHora { get; set; }
    public decimal Valor { get; set; }
}

public class AlertaSummaryDto
{
    public int Id { get; set; }
    public DateTime FechaHora { get; set; }
    public string ComunidadNombre { get; set; } = string.Empty;
    public string SensorNombre { get; set; } = string.Empty;
    public string Fenomeno { get; set; } = string.Empty;
    public string Nivel { get; set; } = string.Empty;
    public decimal ValorDetectado { get; set; }
    public string Estado { get; set; } = "ACTIVA";
}

public class DashboardDto
{
    public DashboardMetricDto Temperatura { get; set; } = new();
    public DashboardMetricDto Humedad { get; set; } = new();
    public DashboardMetricDto Viento { get; set; } = new();
    public DashboardMetricDto Lluvia { get; set; } = new();
    public DashboardMetricDto NivelRio { get; set; } = new();
    public string NivelGeneral { get; set; } = "VERDE";
    public int AlertasActivas { get; set; }
    public int SensoresActivos { get; set; }
    public int SensoresTotales { get; set; }
    public int Comunidades { get; set; }
    public int SensoresInactivos { get; set; }
    public Dictionary<string, int> AlertasPorNivel { get; set; } = new();
    public IReadOnlyList<DashboardCommunityDto> ComunidadesDetalle { get; set; } = Array.Empty<DashboardCommunityDto>();
    public IReadOnlyList<DashboardSeriesPointDto> Series { get; set; } = Array.Empty<DashboardSeriesPointDto>();
    public IReadOnlyList<AlertaSummaryDto> EventosRecientes { get; set; } = Array.Empty<AlertaSummaryDto>();
}
