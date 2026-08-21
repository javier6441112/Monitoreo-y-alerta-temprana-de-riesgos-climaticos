using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Services;

public sealed class ClimateAlertRule : IAlertRule
{
    public AlertDecision? Evaluate(Sensor sensor, decimal value) => sensor.Tipo switch
    {
        "NIVEL_RIO" when value >= 4.5m => new("ROJO", "INUNDACION", "El nivel del río supera el límite de seguridad."),
        "NIVEL_RIO" when value >= 3.5m => new("NARANJA", "INUNDACION", "El nivel del río está en alerta moderada."),
        "NIVEL_RIO" when value >= 2.5m => new("AMARILLO", "INUNDACION", "El nivel del río está elevado."),
        "VIENTO" when value > 80m => new("ROJO", "TORMENTA", "La velocidad del viento supera el límite seguro."),
        "VIENTO" when value > 60m => new("NARANJA", "TORMENTA", "La velocidad del viento está alta."),
        "VIENTO" when value > 40m => new("AMARILLO", "TORMENTA", "Se registró viento fuerte."),
        _ => null
    };
}