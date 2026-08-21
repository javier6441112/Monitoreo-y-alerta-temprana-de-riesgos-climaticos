using WeatherRisk.Api.Models;

namespace WeatherRisk.Api.Services;

public interface IAlertEvaluationService
{
    Task EvaluateAndRegisterAsync(Sensor sensor, decimal value);
}