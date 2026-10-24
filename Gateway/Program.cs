using System.Security.Claims;
using System.Text.Json.Nodes;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using WeatherRisk.Platform;
using Yarp.ReverseProxy.Configuration;

var builder=WebApplication.CreateBuilder(args);
builder.AddPlatform();
builder.Services.AddHealthChecks().AddCheck<DependencyReadiness>("dependencies");
var routes=new List<RouteConfig>();
var clusters=new List<ClusterConfig>();
void Destination(string id,string setting)
{
    clusters.Add(new ClusterConfig{ClusterId=id,Destinations=new Dictionary<string,DestinationConfig>{["primary"]=new(){Address=Hosting.Required(builder.Configuration,setting).TrimEnd('/')+"/"}}});
}
void Route(string id,string path,string cluster,bool anonymous=false,string? remove=null,string? prefix=null)
{
    var transforms=new List<IReadOnlyDictionary<string,string>>();
    if(remove is not null)transforms.Add(new Dictionary<string,string>{{"PathRemovePrefix",remove}});
    if(prefix is not null)transforms.Add(new Dictionary<string,string>{{"PathPrefix",prefix}});
    // Never forward browser-supplied credentials for internal service APIs.
    transforms.Add(new Dictionary<string,string>{{"RequestHeaderRemove","X-Service-Key"}});
    routes.Add(new RouteConfig{RouteId=id,ClusterId=cluster,Match=new(){Path=path},AuthorizationPolicy=anonymous?"anonymous":"default",Order=anonymous?-100:0,Transforms=transforms});
}
Destination("auth","AUTH_URL");Destination("community","COMMUNITY_URL");Destination("sensor","SENSOR_URL");
Destination("alert","ALERT_URL");Destination("report","REPORT_URL");Destination("audit","AUDIT_URL");
Route("login","/api/auth/login","auth",true);
foreach(var prefix in new[]{"auth","usuarios","roles"})Route(prefix,"/api/"+prefix+"/{**rest}","auth");
Route("community","/api/comunidades/{**rest}","community");
Route("community-alias","/api/communities/{**rest}","community",remove:"/api/communities",prefix:"/api/comunidades");
foreach(var prefix in new[]{"sensores","lecturas","monitoreo"})Route(prefix,"/api/"+prefix+"/{**rest}","sensor");
Route("sensor-alias","/api/sensors/{**rest}","sensor",remove:"/api/sensors",prefix:"/api/sensores");
foreach(var prefix in new[]{"alertas","configuracionalertas","historial"})Route(prefix,"/api/"+prefix+"/{**rest}","alert");
Route("alert-alias","/api/alerts/{**rest}","alert",remove:"/api/alerts",prefix:"/api/alertas");
Route("reports","/api/reports/{**rest}","report");
Route("audit","/api/bitacora/{**rest}","audit");
Route("audit-alias","/api/audit/{**rest}","audit");
Route("hub","/hubs/monitoreo/{**rest}","sensor");
builder.Services.AddReverseProxy().LoadFromMemory(routes,clusters);
var origins=(builder.Configuration["CORS_ORIGINS"]??"http://localhost:4200").Split(',',StringSplitOptions.RemoveEmptyEntries|StringSplitOptions.TrimEntries);
builder.Services.AddCors(o=>o.AddDefaultPolicy(p=>p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddRateLimiter(o=>{
    o.RejectionStatusCode=429;
    o.GlobalLimiter=PartitionedRateLimiter.Create<HttpContext,string>(context=>{
        var login=context.Request.Path.Equals("/api/auth/login",StringComparison.OrdinalIgnoreCase);
        var partition=(login?"login:":"api:")+(context.User.FindFirstValue("sub")??context.Connection.RemoteIpAddress?.ToString()??"unknown");
        return RateLimitPartition.GetFixedWindowLimiter(partition,_=>new FixedWindowRateLimiterOptions{PermitLimit=login?10:240,Window=TimeSpan.FromMinutes(1),QueueLimit=0,AutoReplenishment=true});
    });
});
var app=builder.Build();
app.UseCors();
app.UsePlatform("gateway");
app.UseRateLimiter();
app.MapReverseProxy();
app.MapGet("/api/dashboard",async(HttpRequest request,Peers peers)=>{
    var query=Hosting.Query(request);
    var sensors=await peers.Get("SENSOR_URL","/internal/sensors"+query) as JsonArray??[];
    var alerts=await peers.Get("ALERT_URL","/internal/alerts"+query) as JsonArray??[];
    var communities=await peers.Get("COMMUNITY_URL","/internal/communities") as JsonArray??[];
    var events=await peers.Get("ALERT_URL","/internal/events"+query) as JsonArray??[];
    object Metric(string type,string unit){
        var matching=sensors.Where(s=>s!["tipo"]!.GetValue<string>()==type).ToList();
        var value=matching.Count==0?0:matching.Average(s=>s!["valorActual"]!.GetValue<decimal>());
        return new{valor=value,unidad=unit};
    }
    var active=alerts.Where(a=>a!["activa"]?.GetValue<bool>()==true).ToList();
    var levels=new[]{"VERDE","AMARILLO","NARANJA","ROJO"};
    var distribution=active.GroupBy(a=>a!["nivel"]!.GetValue<string>()).ToDictionary(g=>g.Key,g=>g.Count());
    var general=active.Count==0?"VERDE":active.Select(a=>a!["nivel"]!.GetValue<string>()).OrderByDescending(l=>Array.IndexOf(levels,l)).First();
    var activeSensors=sensors.Count(s=>s!["activo"]!.GetValue<bool>());
    return Results.Ok(new{temperatura=Metric("TEMPERATURA","°C"),humedad=Metric("HUMEDAD","%"),viento=Metric("VIENTO","km/h"),lluvia=Metric("LLUVIA","mm/h"),nivelRio=Metric("NIVEL_RIO","m"),
        nivelGeneral=general,alertasActivas=active.Count,sensoresActivos=activeSensors,sensoresTotales=sensors.Count,sensoresInactivos=sensors.Count-activeSensors,
        comunidades=request.Query.ContainsKey("comunidadId")?communities.Count(c=>c!["id"]!.ToString()==request.Query["comunidadId"]):communities.Count,
        alertasPorNivel=distribution,eventosRecientes=events.Take(10).Select(e=>e!.DeepClone()).ToArray()});
}).RequireAuthorization();
app.MapGet("/api/dashboard/series",async(HttpRequest request,Peers peers)=>{
    var rows=await peers.Get("SENSOR_URL","/internal/readings"+Hosting.Query(request))as JsonArray??[];
    return Results.Ok(rows.OrderBy(r=>r!["fechaHora"]!.GetValue<string>()).Select(r=>new{fechaHora=r!["fechaHora"]!.GetValue<string>(),valor=r["valor"]!.GetValue<decimal>()}));
}).RequireAuthorization();
app.Run();
