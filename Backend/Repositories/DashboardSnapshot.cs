namespace WeatherRisk.Api.Repositories;

public class DashboardSnapshot
{
    public decimal Temperatura { get; set; }
    public decimal Humedad { get; set; }
    public decimal Viento { get; set; }
    public decimal Lluvia { get; set; }
    public decimal NivelRio { get; set; }
    public string NivelGeneral { get; set; } = "VERDE";
    public int AlertasActivas { get; set; }
    public int SensoresActivos { get; set; }
    public int SensoresTotales { get; set; }
}
