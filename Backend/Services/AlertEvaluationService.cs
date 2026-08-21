using Microsoft.AspNetCore.SignalR;
using WeatherRisk.Api.Hubs;
using WeatherRisk.Api.Models;
using WeatherRisk.Api.Repositories;

namespace WeatherRisk.Api.Services;

public sealed class AlertEvaluationService : IAlertEvaluationService
{
    private readonly IWeatherRepository _repository;
    private readonly IEnumerable<IAlertRule> _rules;
    private readonly IHubContext<MonitoreoHub> _hubContext;

    public AlertEvaluationService(
        IWeatherRepository repository,
        IEnumerable<IAlertRule> rules,
        IHubContext<MonitoreoHub> hubContext)
    {
        _repository = repository;
        _rules = rules;
        _hubContext = hubContext;
    }

    public async Task EvaluateAndRegisterAsync(Sensor sensor, decimal value)
    {
        var decisions = await Task.WhenAll(_rules.Select(rule => rule.EvaluateAsync(sensor, value)));
        var decision = decisions.FirstOrDefault(result => result is not null);

        if (decision is null)
            return;

        var alerta = await _repository.CreateAlertaAsync(new Alerta
        {
            SensorId = sensor.Id,
            Nivel = decision.Nivel,
            Fenomeno = decision.Fenomeno,
            Mensaje = decision.Mensaje,
            ValorDetectado = value,
            Activa = true
        });

        await _repository.CreateBitacoraAsync(new Bitacora
        {
            UsuarioId = 1,
            Usuario = "sistema",
            Accion = "ALERTA_GENERADA",
            Descripcion = $"Se generó alerta {decision.Nivel} para {sensor.Nombre}."
        });

        await _repository.CreateBitacoraAsync(new Bitacora
        {
            UsuarioId = 1,
            Usuario = "sistema",
            Accion = "REGISTRO_HISTORIAL",
            Descripcion = $"Evento {decision.Fenomeno} registrado para {sensor.Nombre}."
        });

        await _repository.CreateHistorialEventoAsync(new HistorialEvento
        {
            SensorId = sensor.Id,
            AlertaId = alerta.Id,
            Fenomeno = decision.Fenomeno,
            Nivel = decision.Nivel,
            Mensaje = decision.Mensaje,
            FechaHora = DateTime.UtcNow
        });

        await _hubContext.Clients.All.SendAsync("alertaGenerada", alerta);
    }
}