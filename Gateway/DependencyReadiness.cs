using Microsoft.Extensions.Diagnostics.HealthChecks;
using WeatherRisk.Platform;

public sealed class DependencyReadiness(IHttpClientFactory clients,IConfiguration configuration):IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context,CancellationToken cancellationToken=default)
    {
        try {
            var results=await Task.WhenAll(new[]{"AUTH_URL","COMMUNITY_URL","SENSOR_URL","ALERT_URL","REPORT_URL","AUDIT_URL"}.Select(async key=>{
                using var response=await clients.CreateClient("peers").GetAsync(Hosting.Required(configuration,key)+"/ready",cancellationToken);
                return response.IsSuccessStatusCode;
            }));
            return results.All(healthy=>healthy)?HealthCheckResult.Healthy():HealthCheckResult.Unhealthy("Dependency unavailable");
        } catch {return HealthCheckResult.Unhealthy("Dependency unavailable");}
    }
}
