using System.Data.Common;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Data.SqlClient;
using WeatherRisk.Platform;

var builder = WebApplication.CreateBuilder(args);
builder.AddPlatform();
builder.Services.AddSignalR();
builder.Services.AddSingleton<ReadingWriter>();
var connectionString = Hosting.Required(builder.Configuration, "DATABASE_URL");
builder.Services.AddSingleton(new Database(() => new SqlConnection(connectionString)));
builder.Services.AddHealthChecks().AddCheck<Database>("database");
builder.Services.AddHostedService<EvaluationWorker>();
builder.Services.AddHostedService<SimulationWorker>();
var app = builder.Build();
app.UsePlatform("sensor");
var db = app.Services.GetRequiredService<Database>();
var settings = new SqlConnectionStringBuilder(connectionString);
var databaseName = settings.InitialCatalog;
if (!System.Text.RegularExpressions.Regex.IsMatch(databaseName, "^[A-Za-z][A-Za-z0-9_]{0,63}$")) throw new InvalidOperationException("Invalid database name");
settings.InitialCatalog = "master";
await new Database(() => new SqlConnection(settings.ConnectionString)).Execute($"IF DB_ID(N'{databaseName}') IS NULL CREATE DATABASE [{databaseName}]");
await db.Execute(SensorSchema.Sql);

var sensors = app.MapGroup("/api/sensores").RequireAuthorization();
var readings = app.MapGroup("/api/lecturas").RequireAuthorization();
app.MapHub<ClimateHub>("/hubs/monitoreo").RequireAuthorization();

string Pagination(HttpRequest request)
{
    if (!request.Query.ContainsKey("page")) return "";
    if (!int.TryParse(request.Query["page"], out var page) || page<1) throw new ApiError(400,"Invalid page");
    var size = int.TryParse(request.Query["pageSize"], out var n) ? n : 200;
    if (size<1 || size>200) throw new ApiError(400,"Invalid pageSize");
    return $" OFFSET {(long)(page-1)*size} ROWS FETCH NEXT {size} ROWS ONLY";
}
async Task<JsonArray> ListSensors(HttpRequest request, Peers peers)
{
    var sql = "SELECT * FROM sensors WHERE 1=1";
    var parameters = new Dictionary<string,object?>();
    foreach (var field in new[]{"tipo","codigo","comunidadId"})
        if (request.Query.TryGetValue(field,out var value)) { sql += field=="codigo" ? " AND codigo LIKE @codigo" : $" AND {field}=@{field}"; parameters[field] = field=="codigo" ? "%"+value+"%" : value.ToString(); }
    if (bool.TryParse(request.Query["activo"],out var active)) { sql+=" AND activo=@activo"; parameters["activo"]=active; }
    if (request.Query.TryGetValue("buscar",out var search)) { sql+=" AND (nombre LIKE @buscar OR codigo LIKE @buscar)"; parameters["buscar"]="%"+search+"%"; }
    foreach (var field in new[] { "desde", "hasta" })
        if (Hosting.Date(request, field) is {} date) { sql += $" AND ultimaLectura{(field == "desde" ? ">=" : "<=")}@{field}"; parameters[field] = date; }
    var rows = await db.Query(sql+" ORDER BY id"+Pagination(request),parameters);
    var communities = rows.Count == 0 ? new JsonArray() : await peers.Get("COMMUNITY_URL", "/internal/communities/lookup") as JsonArray ?? [];
    foreach (var row in rows)
    {
        row!["comunidadNombre"] = communities.FirstOrDefault(c => c!["id"]!.GetValue<int>() == row["comunidadId"]!.GetValue<int>())?["nombre"]?.DeepClone();
        var last = row!["ultimaLectura"]?.GetValue<DateTime>();
        row["estadoComunicacion"] = row["activo"]!.GetValue<bool>() ? last is null || last < DateTime.UtcNow.AddMinutes(-15) ? "SIN_COMUNICACION" : "ACTIVO" : "INACTIVO";
    }
    return rows;
}
sensors.MapGet("",ListSensors);
app.MapGet("/internal/sensors",ListSensors);
app.MapGet("/internal/sensors/counts",async()=>await db.Query("SELECT comunidadId,COUNT(*) total,SUM(CASE WHEN activo=1 THEN 1 ELSE 0 END) activos FROM sensors GROUP BY comunidadId"));
async Task<IResult> FindSensor(int id, Peers peers)
{
    var rows=await db.Query("SELECT * FROM sensors WHERE id=@id",new(){["id"]=id});
    if (rows.Count > 0)
    {
        var community = await peers.Get("COMMUNITY_URL", "/internal/communities/" + rows[0]!["comunidadId"]);
        rows[0]!["comunidadNombre"] = community?["nombre"]?.DeepClone();
    }
    return rows.Count==0 ? Results.NotFound() : Results.Json(rows[0]!.DeepClone());
}
sensors.MapGet("/{id:int}",FindSensor);
app.MapGet("/internal/sensors/{id:int}",FindSensor);
Dictionary<string,object?> Values(JsonObject body) => new()
{
    ["nombre"]=Hosting.Text(body,"nombre"),["codigo"]=Hosting.Text(body,"codigo",50),["tipo"]=Hosting.Text(body,"tipo",50),["unidad"]=Hosting.Text(body,"unidad",30),
    ["comunidadId"]=Hosting.Id(body,"comunidadId"),["latitud"]=body["latitud"]?.GetValue<decimal>(),["longitud"]=body["longitud"]?.GetValue<decimal>(),
    ["descripcion"]=body["descripcion"]?.GetValue<string>(),["fechaInstalacion"]=body["fechaInstalacion"] is null ? null : DateTimeOffset.Parse(body["fechaInstalacion"]!.GetValue<string>()).UtcDateTime,
    ["activo"]=body["activo"]?.GetValue<bool>() ?? true
};
sensors.MapPost("",async Task<IResult> (JsonObject body,HttpContext context,Peers peers)=>{
    var values=Values(body);
    await peers.Get("COMMUNITY_URL","/internal/communities/"+values["comunidadId"]);
    try {
        var rows=await db.Query("INSERT INTO sensors(nombre,codigo,tipo,unidad,comunidadId,latitud,longitud,descripcion,fechaInstalacion,activo) OUTPUT inserted.* VALUES(@nombre,@codigo,@tipo,@unidad,@comunidadId,@latitud,@longitud,@descripcion,COALESCE(@fechaInstalacion,SYSUTCDATETIME()),@activo)",values);
        await peers.Audit(Hosting.Actor(context),"CREAR_SENSOR","sensor",rows[0]!["id"]!.GetValue<int>());
        return Results.Created("/api/sensores/"+rows[0]!["id"],rows[0]!.DeepClone());
    } catch(SqlException error) when(error.Number is 2601 or 2627) { throw new ApiError(409,"Sensor code already exists"); }
}).RequireAuthorization(p=>p.RequireRole("ADMIN","OPERADOR"));
sensors.MapPut("/{id:int}",async Task<IResult> (int id,JsonObject body,HttpContext context,Peers peers)=>{
    var values=Values(body);values["id"]=id;
    if(body["activo"] is null) values["activo"]=null;
    await peers.Get("COMMUNITY_URL","/internal/communities/"+values["comunidadId"]);
    var rows=await db.Query("UPDATE sensors SET nombre=@nombre,codigo=@codigo,tipo=@tipo,unidad=@unidad,comunidadId=@comunidadId,latitud=@latitud,longitud=@longitud,descripcion=@descripcion,fechaInstalacion=@fechaInstalacion,activo=COALESCE(@activo,activo) OUTPUT inserted.* WHERE id=@id",values);
    if(rows.Count==0) return Results.NotFound();
    await peers.Audit(Hosting.Actor(context),"EDITAR_SENSOR","sensor",id);
    return Results.Json(rows[0]!.DeepClone());
}).RequireAuthorization(p=>p.RequireRole("ADMIN","OPERADOR"));
sensors.MapPatch("/{id:int}/estado",async Task<IResult> (int id,JsonObject body,HttpContext context,Peers peers)=>{
    var changed=await db.Execute("UPDATE sensors SET activo=@activo WHERE id=@id",new(){["id"]=id,["activo"]=body["activo"]?.GetValue<bool>() ?? throw new ApiError(400,"activo required")});
    if(changed==0) return Results.NotFound();
    await peers.Audit(Hosting.Actor(context),"ESTADO_SENSOR","sensor",id);
    return Results.Ok(new{status=200,message="Estado actualizado",data=new{id,activo=body["activo"]!.GetValue<bool>()}});
}).RequireAuthorization(p=>p.RequireRole("ADMIN","OPERADOR"));
sensors.MapDelete("/{id:int}",async Task<IResult>(int id,HttpContext context,Peers peers)=>{
    try {
        var changed=await db.Execute("DELETE FROM sensors WHERE id=@id",new(){["id"]=id});
        if(changed==0)return Results.NotFound();
        await peers.Audit(Hosting.Actor(context),"ELIMINAR_SENSOR","sensor",id);return Results.NoContent();
    } catch(SqlException error) when(error.Number==547){throw new ApiError(409,"Sensor has readings; deactivate it instead");}
}).RequireAuthorization(p=>p.RequireRole("ADMIN"));

async Task<JsonArray> ListReadings(HttpRequest request)
{
    var sql="SELECT r.id,r.sensorId,s.nombre sensorNombre,s.comunidadId,r.fechaHora,r.valor,s.unidad,CASE WHEN s.activo=1 THEN 'ACTIVO' ELSE 'INACTIVO' END estadoSensor,s.tipo FROM readings r JOIN sensors s ON s.id=r.sensorId WHERE 1=1";
    var parameters=new Dictionary<string,object?>();
    foreach(var field in new[]{"sensorId","comunidadId","tipo"})
        if(request.Query.TryGetValue(field,out var value)){sql+=$" AND {(field=="sensorId"?"r":"s")}.{field}=@{field}";parameters[field]=value.ToString();}
    foreach(var field in new[]{"desde","hasta"})
        if(Hosting.Date(request,field) is {} date){sql+=$" AND r.fechaHora{(field=="desde"?">=":"<=")}@{field}";parameters[field]=date;}
    return await db.Query(sql+" ORDER BY r.fechaHora DESC,r.id DESC"+Pagination(request),parameters);
}
readings.MapGet("",ListReadings);
app.MapGet("/internal/readings",ListReadings);
readings.MapPost("",async(JsonObject body,ReadingWriter writer,HttpContext context)=>{
    return await writer.Write(Hosting.Id(body,"sensorId"),body["valor"]?.GetValue<decimal>() ?? throw new ApiError(400,"valor required"),Hosting.Actor(context));
}).RequireAuthorization(p=>p.RequireRole("ADMIN","OPERADOR"));
app.MapPost("/api/monitoreo/reiniciar",async(HttpContext context,Peers peers)=>{
    await db.Execute("UPDATE monitor_settings SET enabled=1 WHERE id=1");
    await peers.Audit(Hosting.Actor(context),"REINICIAR_MONITOREO","sensor");
    return Results.Ok(new{message="Simulación de monitoreo habilitada"});
}).RequireAuthorization(p=>p.RequireRole("ADMIN"));
app.MapPatch("/api/monitoreo/estado",async(JsonObject body)=>{
    await db.Execute("UPDATE monitor_settings SET enabled=@enabled WHERE id=1",new(){["enabled"]=body["activo"]?.GetValue<bool>() ?? throw new ApiError(400,"activo required")});
    return Results.NoContent();
}).RequireAuthorization(p=>p.RequireRole("ADMIN"));
app.Run();

public sealed class ClimateHub:Hub {}
public sealed class ReadingWriter(Database db,Peers peers,IHubContext<ClimateHub> hub)
{
    public async Task<JsonNode> Write(int sensorId,decimal value,string actor)
    {
        var sensors=await db.Query("SELECT * FROM sensors WHERE id=@id",new(){["id"]=sensorId});
        if(sensors.Count==0)throw new ApiError(404,"Sensor not found");
        var sensor=sensors[0]!;
        if(!sensor["activo"]!.GetValue<bool>())throw new ApiError(400,"Sensor inactive");
        var rules=await peers.Get("ALERT_URL","/internal/rules?tipoSensor="+Uri.EscapeDataString(sensor["tipo"]!.GetValue<string>())) as JsonArray ?? [];
        if(!rules.Any(r=>r!["activo"]!.GetValue<bool>()))throw new ApiError(400,"No active alert rules for sensor");
        var date=DateTime.UtcNow;
        await using var connection=db.Create();await connection.OpenAsync();
        await using var transaction=await connection.BeginTransactionAsync();
        var rows=await Database.QueryOn(connection,transaction,"INSERT INTO readings(sensorId,valor,fechaHora) OUTPUT inserted.* VALUES(@id,@value,@date)",new(){["id"]=sensorId,["value"]=value,["date"]=date});
        var reading=rows[0]!;
        await Database.ExecuteOn(connection,transaction,"UPDATE sensors SET valorActual=@value,ultimaLectura=@date WHERE id=@id",new(){["id"]=sensorId,["value"]=value,["date"]=date});
        var payload=new{readingId=reading["id"]!.GetValue<int>(),sensorId,comunidadId=sensor["comunidadId"]!.GetValue<int>(),sensorNombre=sensor["nombre"]!.GetValue<string>(),tipo=sensor["tipo"]!.GetValue<string>(),unidad=sensor["unidad"]!.GetValue<string>(),valor=value,fechaHora=date};
        await Database.ExecuteOn(connection,transaction,"INSERT INTO evaluation_outbox(payload) VALUES(@payload)",new(){["payload"]=JsonSerializer.Serialize(payload)});
        await transaction.CommitAsync();
        await hub.Clients.All.SendAsync("lecturaActualizada",new{sensorId,valor=value,fechaHora=date});
        var result=reading.DeepClone();
        result["comunidadId"]=sensor["comunidadId"]!.DeepClone();result["sensorNombre"]=sensor["nombre"]!.DeepClone();result["unidad"]=sensor["unidad"]!.DeepClone();result["estadoSensor"]="ACTIVO";
        await peers.Audit(actor,"REGISTRAR_LECTURA","reading",reading["id"]!.GetValue<int>());
        return result;
    }
}
public sealed class EvaluationWorker(Database db,Peers peers,IHubContext<ClimateHub> hub,ILogger<EvaluationWorker> logger):BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while(!stoppingToken.IsCancellationRequested)
        {
            JsonNode? job=null;
            try {
                var jobs=await db.Query("WITH next_job AS (SELECT TOP(1) * FROM evaluation_outbox WITH(UPDLOCK,READPAST,ROWLOCK) WHERE availableAt<=SYSUTCDATETIME() ORDER BY id) UPDATE next_job SET availableAt=DATEADD(second,30,SYSUTCDATETIME()) OUTPUT inserted.*");
                job=jobs.FirstOrDefault();
                if(job is not null){
                    var alert=await peers.Post("ALERT_URL","/internal/evaluate",JsonNode.Parse(job["payload"]!.GetValue<string>())!);
                    if(alert?["id"] is not null) await hub.Clients.All.SendAsync("alertaGenerada",alert,stoppingToken);
                    await db.Execute("DELETE FROM evaluation_outbox WHERE id=@id",new(){["id"]=job["id"]!.GetValue<long>()});
                }
            } catch(Exception error) when(!stoppingToken.IsCancellationRequested){
                logger.LogWarning(error,"Alert evaluation deferred");
                if(job is not null)await db.Execute("UPDATE evaluation_outbox SET attempts=attempts+1,availableAt=DATEADD(second,30,SYSUTCDATETIME()) WHERE id=@id",new(){["id"]=job["id"]!.GetValue<long>()});
            }
            await Task.Delay(TimeSpan.FromSeconds(2),stoppingToken);
        }
    }
}
public sealed class SimulationWorker(Database db,ReadingWriter writer,ILogger<SimulationWorker> logger):BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while(!stoppingToken.IsCancellationRequested){
            await Task.Delay(TimeSpan.FromSeconds(15),stoppingToken);
            try{
                var enabled=(await db.Query("SELECT enabled FROM monitor_settings WHERE id=1"))[0]!["enabled"]!.GetValue<bool>();
                if(!enabled)continue;
                foreach(var sensor in await db.Query("SELECT id,valorActual FROM sensors WHERE activo=1")){
                    await writer.Write(sensor!["id"]!.GetValue<int>(),Math.Max(0,sensor["valorActual"]!.GetValue<decimal>()+(decimal)(Random.Shared.NextDouble()*2-1)),"system");
                }
            }catch(Exception error)when(!stoppingToken.IsCancellationRequested){logger.LogWarning(error,"Simulation iteration failed");}
        }
    }
}
public static class SensorSchema
{
    public const string Sql="""
IF OBJECT_ID('sensors') IS NULL CREATE TABLE sensors(
id int IDENTITY PRIMARY KEY,nombre nvarchar(200) NOT NULL,codigo nvarchar(50) NOT NULL UNIQUE,tipo nvarchar(50) NOT NULL,unidad nvarchar(30) NOT NULL,
comunidadId int NOT NULL,latitud decimal(10,7),longitud decimal(10,7),activo bit NOT NULL DEFAULT 1,fechaInstalacion datetime2,descripcion nvarchar(1000),
fechaCreacion datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),valorActual decimal(18,3) NOT NULL DEFAULT 0,ultimaLectura datetime2);
IF OBJECT_ID('readings') IS NULL CREATE TABLE readings(id int IDENTITY PRIMARY KEY,sensorId int NOT NULL REFERENCES sensors(id),valor decimal(18,3) NOT NULL,fechaHora datetime2 NOT NULL);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='IX_readings_sensor_date') CREATE INDEX IX_readings_sensor_date ON readings(sensorId,fechaHora);
IF OBJECT_ID('evaluation_outbox') IS NULL CREATE TABLE evaluation_outbox(id bigint IDENTITY PRIMARY KEY,payload nvarchar(max) NOT NULL,availableAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME(),attempts int NOT NULL DEFAULT 0);
IF OBJECT_ID('monitor_settings') IS NULL BEGIN CREATE TABLE monitor_settings(id int PRIMARY KEY,enabled bit NOT NULL);INSERT INTO monitor_settings VALUES(1,0);END;
""";
}
