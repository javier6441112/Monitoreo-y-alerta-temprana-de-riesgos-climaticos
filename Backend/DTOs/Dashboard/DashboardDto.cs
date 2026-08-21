namespace WeatherRisk.Api.DTOs.Dashboard;

public class DashboardMetricDto
{
    public decimal Valor { get; set; }
    public string Unidad { get; set; } = string.Empty;
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
}
