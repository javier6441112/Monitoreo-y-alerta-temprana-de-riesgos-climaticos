using WeatherRisk.Api.Repositories;
using WeatherRisk.Api.Services;

namespace WeatherRisk.Api.DependencyInjection;

public static class WeatherRiskServiceCollectionExtensions
{
    public static IServiceCollection AddWeatherRiskApplication(this IServiceCollection services)
    {
        services.AddScoped<IUsuarioRepository, SqlUsuarioRepository>();
        services.AddScoped<IComunidadRepository, SqlComunidadRepository>();
        services.AddScoped<ISensorRepository, SqlSensorRepository>();
        services.AddScoped<IAlertaRepository, SqlAlertaRepository>();
        services.AddScoped<IAuditRepository, SqlAuditRepository>();
        services.AddScoped<IDashboardRepository, SqlDashboardRepository>();

        services.AddScoped<TokenRevocationService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUsuariosService, UsuariosService>();
        services.AddScoped<ISensoresService, SensoresService>();
        services.AddScoped<ILecturasService, LecturasService>();
        services.AddScoped<IAlertasService, AlertasService>();
        services.AddScoped<IHistorialService, HistorialService>();
        services.AddScoped<IBitacoraService, BitacoraService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IMonitoreoService, MonitoreoService>();
        services.AddScoped<IAlertEvaluationService, AlertEvaluationService>();
        services.AddScoped<IAlertRule, ClimateAlertRule>();
        services.AddScoped<IConfiguracionAlertaService, ConfiguracionAlertaService>();
        services.AddScoped<IComunidadService, ComunidadService>();
        return services;
    }
}
