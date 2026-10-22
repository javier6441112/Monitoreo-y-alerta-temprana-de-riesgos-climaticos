using Microsoft.EntityFrameworkCore;
using WeatherRisk.Api.Data;
using WeatherRisk.Api.DTOs.Dashboard;

namespace WeatherRisk.Api.Repositories;

public sealed class SqlDashboardRepository : IDashboardRepository
{
    private readonly WeatherDbContext _context;

    public SqlDashboardRepository(WeatherDbContext context) => _context = context;

    public async Task<DashboardSnapshot> GetDashboardSnapshotAsync(DashboardFiltersDto filters)
    {
        var query = _context.Sensores.AsQueryable();
        if (filters.ComunidadId.HasValue) query = query.Where(s => s.ComunidadId == filters.ComunidadId.Value);
        if (filters.Desde.HasValue) query = query.Where(s => s.UltimaLectura >= filters.Desde.Value);
        if (filters.Hasta.HasValue) query = query.Where(s => s.UltimaLectura <= filters.Hasta.Value);

        var sensores = await query.ToListAsync();
        var alertas = await _context.Alertas
            .Include(a => a.Sensor)
            .Where(a => a.Activa && (filters.ComunidadId == null || a.Sensor != null && a.Sensor.ComunidadId == filters.ComunidadId.Value))
            .ToListAsync();

        var temperatura = sensores.FirstOrDefault(s => s.Tipo == "TEMPERATURA")?.ValorActual ?? 0m;
        var humedad = sensores.FirstOrDefault(s => s.Tipo == "HUMEDAD")?.ValorActual ?? 0m;
        var viento = sensores.FirstOrDefault(s => s.Tipo == "VIENTO")?.ValorActual ?? 0m;
        var lluvia = sensores.FirstOrDefault(s => s.Tipo == "LLUVIA")?.ValorActual ?? 0m;
        var nivelRio = sensores.FirstOrDefault(s => s.Tipo == "NIVEL_RIO")?.ValorActual ?? 0m;

        var snapshot = new DashboardSnapshot
        {
            Temperatura = temperatura, Humedad = humedad, Viento = viento, Lluvia = lluvia,
            NivelRio = nivelRio, AlertasActivas = alertas.Count,
            SensoresActivos = sensores.Count(s => s.Activo), SensoresTotales = sensores.Count,
            NivelGeneral = "VERDE"
        };
        if (nivelRio >= 3.5m) snapshot.NivelGeneral = "NARANJA";
        if (nivelRio > 4.5m) snapshot.NivelGeneral = "ROJO";
        if (viento >= 40m && viento < 60m) snapshot.NivelGeneral = "AMARILLO";
        return snapshot;
    }

    public async Task<List<DashboardSeriesDto>> GetDashboardSeriesAsync(DashboardFiltersDto filters)
    {
        var query = _context.LecturasSensores.AsQueryable();
        if (filters.ComunidadId.HasValue) query = query.Where(l => l.Sensor!.ComunidadId == filters.ComunidadId.Value);
        if (filters.Desde.HasValue) query = query.Where(l => l.FechaHora >= filters.Desde.Value);
        if (filters.Hasta.HasValue) query = query.Where(l => l.FechaHora <= filters.Hasta.Value);
        return await query.OrderBy(l => l.FechaHora).Select(l => new DashboardSeriesDto { FechaHora = l.FechaHora, Valor = l.Valor }).ToListAsync();
    }
}
