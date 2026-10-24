import base64
import hashlib
import json
import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from enum import Enum
from statistics import mean
from fastapi import FastAPI, Depends, HTTPException, Header, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field
from pymongo import MongoClient, DESCENDING
from pymongo.errors import DuplicateKeyError
import gridfs
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML, default_url_fetcher
from common.security import permission, required
from common.http import get, audit
from common.errors import install_errors

client = MongoClient(required("MONGO_URL"), serverSelectionTimeoutMS=5000, tz_aware=True)
db = client[required("MONGO_DATABASE")]
files = gridfs.GridFS(db)
templates = Environment(loader=FileSystemLoader("templates"), autoescape=select_autoescape(["html"]))
MAX_ROWS = 10000

class ReportType(str, Enum):
    COMMUNITIES = "COMMUNITIES"
    SENSORS = "SENSORS"
    READINGS = "READINGS"
    ALERTS = "ALERTS"
    EVENTS = "EVENTS"
    SENSOR_STATUS = "SENSOR_STATUS"
    CLIMATE_STATISTICS = "CLIMATE_STATISTICS"
    EXECUTIVE = "EXECUTIVE"

class Filters(BaseModel):
    model_config = ConfigDict(extra="forbid")
    sensorId: int | None = Field(None, gt=0)
    comunidadId: int | None = Field(None, gt=0)
    desde: datetime | None = None
    hasta: datetime | None = None
    tipo: str | None = Field(None, max_length=50)
    fenomeno: str | None = Field(None, max_length=50)
    nivel: str | None = Field(None, pattern="^(VERDE|AMARILLO|NARANJA|ROJO)$")

class Request(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: ReportType
    filters: Filters = Field(default_factory=Filters)

@asynccontextmanager
async def lifespan(app):
    db.reports.create_index([("generatedAt", DESCENDING)])
    db.reports.create_index("requestKey", unique=True, sparse=True)
    yield
    client.close()

app = FastAPI(title="Weather Risk Reports", lifespan=lifespan)
install_errors(app)
@app.get("/health")
def health():
    return {"status": "ok", "service": "report"}
@app.get("/ready")
def ready():
    client.admin.command("ping")
    return {"status": "ok"}

def fetch_all(service, path, params):
    result = []
    for page in range(1, MAX_ROWS // 200 + 2):
        rows = get(service, path, {**params, "page": page, "pageSize": 200})
        if not isinstance(rows, list):
            raise HTTPException(503, "Invalid data service response")
        result.extend(rows)
        if len(result) > MAX_ROWS:
            raise HTTPException(413, "Report exceeds 10000 rows; narrow the filters")
        if len(rows) < 200:
            return result
    raise HTTPException(413, "Report too large")

def data(report_type, params):
    communities = fetch_all("COMMUNITY_URL", "/internal/communities", {})
    community_names = {c["id"]: c["nombre"] for c in communities}
    sensors = fetch_all("SENSOR_URL", "/internal/sensors", {"comunidadId": params["comunidadId"]} if params.get("comunidadId") else {})
    sensor_names = {s["id"]: s for s in sensors}
    for sensor in sensors:
        sensor["comunidadNombre"] = community_names.get(sensor["comunidadId"], "")
    if report_type == ReportType.COMMUNITIES:
        rows = [c for c in communities if not params.get("comunidadId") or c["id"] == params["comunidadId"]]
        return rows, [("nombre","Nombre"),("municipio","Municipio"),("departamento","Departamento"),("pais","País"),("latitud","Latitud"),("longitud","Longitud"),("activo","Activo"),("sensoresTotales","Sensores")]
    if report_type in (ReportType.SENSORS, ReportType.SENSOR_STATUS):
        rows = [s for s in sensors if (not params.get("sensorId") or s["id"] == params["sensorId"]) and (not params.get("tipo") or s["tipo"] == params["tipo"])]
        if report_type == ReportType.SENSOR_STATUS:
            return rows, [("codigo","Código"),("nombre","Sensor"),("estadoComunicacion","Estado"),("ultimaLectura","Última lectura"),("comunidadNombre","Comunidad")]
        return rows, [("codigo","Código"),("nombre","Nombre"),("tipo","Tipo"),("comunidadNombre","Comunidad"),("latitud","Latitud"),("longitud","Longitud"),("unidad","Unidad"),("activo","Activo"),("fechaInstalacion","Instalación")]
    if report_type == ReportType.READINGS:
        rows = fetch_all("SENSOR_URL","/internal/readings",params)
        for row in rows:
            row["comunidadNombre"] = community_names.get(row["comunidadId"], "")
        return rows, [("sensorNombre","Sensor"),("comunidadNombre","Comunidad"),("fechaHora","Fecha y hora UTC"),("valor","Valor"),("unidad","Unidad"),("estadoSensor","Estado")]
    if report_type in (ReportType.ALERTS, ReportType.EVENTS):
        rows = fetch_all("ALERT_URL","/internal/alerts" if report_type == ReportType.ALERTS else "/internal/events",params)
        for row in rows:
            row["comunidadNombre"] = community_names.get(row["comunidadId"], "")
        return rows, [("fechaHora","Fecha y hora UTC"),("comunidadNombre","Comunidad"),("sensorNombre","Sensor"),("fenomeno","Fenómeno"),("nivel","Nivel"),("valorDetectado","Valor"),("valorMinimo","Umbral mín."),("valorMaximo","Umbral máx."),("mensaje","Mensaje"),("estado","Estado")]
    readings = fetch_all("SENSOR_URL","/internal/readings",params)
    alerts = fetch_all("ALERT_URL","/internal/alerts",params)
    summary = []
    for sensor_type, label in [("TEMPERATURA","Temperatura"),("HUMEDAD","Humedad"),("VIENTO","Viento"),("LLUVIA","Lluvia"),("NIVEL_RIO","Nivel de río")]:
        values = [r["valor"] for r in readings if r.get("tipo") == sensor_type]
        summary.extend([{"indicador":label+" promedio","valor":round(mean(values),3) if values else "Sin datos"},
                        {"indicador":label+" mínimo","valor":min(values) if values else "Sin datos"},
                        {"indicador":label+" máximo","valor":max(values) if values else "Sin datos"}])
        if sensor_type == "LLUVIA":
            summary.append({"indicador":"Lluvia acumulada (mm)","valor":rainfall(readings)})
    summary.append({"indicador":"Alertas en período","valor":len(alerts)})
    if report_type == ReportType.EXECUTIVE:
        events = fetch_all("ALERT_URL","/internal/events",params)
        levels = ["VERDE","AMARILLO","NARANJA","ROJO"]
        active = [a for a in alerts if a.get("activa")]
        summary = [{"indicador":"Nivel general","valor":max((a["nivel"] for a in active),key=levels.index,default="VERDE")},
                   {"indicador":"Comunidades","valor":len([c for c in communities if not params.get("comunidadId") or c["id"]==params["comunidadId"]])},
                   {"indicador":"Sensores","valor":len(sensors)},{"indicador":"Sensores activos","valor":sum(s["activo"] for s in sensors)},
                   {"indicador":"Alertas activas","valor":len(active)},{"indicador":"Eventos","valor":len(events)}]+summary
        for level in levels:
            summary.append({"indicador":"Alertas "+level,"valor":sum(a["nivel"]==level for a in alerts)})
        for phenomenon in sorted({e["fenomeno"] for e in events}):
            summary.append({"indicador":"Eventos "+phenomenon,"valor":sum(e["fenomeno"]==phenomenon for e in events)})
    return summary, [("indicador","Indicador"),("valor","Valor")]

def rainfall(readings):
    # Rate readings in mm/h are integrated over elapsed hours per sensor.
    grouped = {}
    total = 0.0
    for row in readings:
        if row.get("tipo") == "LLUVIA":
            grouped.setdefault(row["sensorId"], []).append(row)
    for rows in grouped.values():
        rows.sort(key=lambda r:r["fechaHora"])
        for previous, current in zip(rows, rows[1:]):
            start = datetime.fromisoformat(previous["fechaHora"].replace("Z","+00:00"))
            end = datetime.fromisoformat(current["fechaHora"].replace("Z","+00:00"))
            total += float(previous["valor"]) * max(0,(end-start).total_seconds())/3600
    return round(total,3)

TITLES = dict(zip(ReportType, ["Comunidades","Sensores","Lecturas","Alertas","Historial de eventos","Estado de sensores","Estadísticas climáticas","Reporte ejecutivo"]))
def metadata(record):
    result = {k:v for k,v in record.items() if k not in ("_id","fileId","requestKey","requestHash")}
    result["id"] = record["_id"]
    return jsonable_encoder(result)

def authorize_record(report_id, claims):
    record = db.reports.find_one({"_id":report_id})
    if not record:
        raise HTTPException(404,"Report not found")
    if claims.get("role") != "ADMIN" and record["generatedBy"] != claims["sub"]:
        raise HTTPException(403,"Report belongs to another user")
    return record

def safe_fetcher(url, *args, **kwargs):
    if not url.startswith("data:"):
        raise ValueError("External resources are disabled in PDF rendering")
    return default_url_fetcher(url, *args, **kwargs)

@app.post("/api/reports", status_code=201)
def generate(request: Request, claims=Depends(permission("reports:generate")), idempotency_key: str | None=Header(default=None)):
    params = request.filters.model_dump(mode="json", exclude_none=True)
    if request.filters.desde and request.filters.hasta:
        if request.filters.desde > request.filters.hasta:
            raise HTTPException(400,"Invalid date range")
    now = datetime.now(timezone.utc)
    report_id = str(uuid.uuid4())
    record = {"_id":report_id,"reportId":report_id,"type":request.type.value,"generatedBy":claims["sub"],
              "generatedByName":claims.get("name",claims["sub"]),"generatedAt":now,"filters":params,
              "status":"GENERATING","fileName":request.type.value.lower()+"-"+report_id+".pdf","downloadedAt":None}
    if idempotency_key:
        if len(idempotency_key)>200:
            raise HTTPException(400,"Invalid idempotency key")
        record["requestKey"] = hashlib.sha256((claims["sub"]+":"+idempotency_key).encode()).hexdigest()
        record["requestHash"] = hashlib.sha256(json.dumps(request.model_dump(mode="json"),sort_keys=True).encode()).hexdigest()
    try:
        db.reports.insert_one(record)
    except DuplicateKeyError:
        old = db.reports.find_one({"requestKey":record["requestKey"]})
        if old["requestHash"] != record["requestHash"]:
            raise HTTPException(409,"Idempotency key already used with different parameters")
        return metadata(old)
    try:
        rows, columns = data(request.type, params)
        logo = base64.b64encode(open("templates/logo.svg","rb").read()).decode()
        html = templates.get_template("report.html").render(title=TITLES[request.type], rows=rows, columns=columns,
            date=now.isoformat(), user=record["generatedByName"], report_id=report_id, filters=params, logo=logo)
        pdf = HTML(string=html,url_fetcher=safe_fetcher).write_pdf()
        file_id = files.put(pdf, filename=record["fileName"], contentType="application/pdf")
        record.update(status="COMPLETED",fileId=file_id,rowCount=len(rows))
        db.reports.update_one({"_id":report_id},{"$set":{"status":"COMPLETED","fileId":file_id,"rowCount":len(rows)}})
        audit(claims["sub"],"GENERAR_REPORTE","report",report_id)
        return metadata(record)
    except Exception as error:
        db.reports.update_one({"_id":report_id},{"$set":{"status":"FAILED"}})
        if isinstance(error,HTTPException):
            raise
        logging.exception("Report generation failed")
        raise HTTPException(503,"Report generation failed; consult history")

@app.get("/api/reports")
def history(page:int=Query(1,ge=1),pageSize:int=Query(20,ge=1,le=200),claims=Depends(permission("reports:read"))):
    query = {} if claims.get("role")=="ADMIN" else {"generatedBy":claims["sub"]}
    rows = db.reports.find(query).sort("generatedAt",-1).skip((page-1)*pageSize).limit(pageSize)
    return {"items":[metadata(row) for row in rows],"page":page,"pageSize":pageSize,"total":db.reports.count_documents(query)}

@app.get("/api/reports/{report_id}")
def detail(report_id:str,claims=Depends(permission("reports:read"))):
    return metadata(authorize_record(report_id,claims))

@app.get("/api/reports/{report_id}/download")
def download(report_id:str,claims=Depends(permission("reports:download",administrator=True))):
    record = authorize_record(report_id,claims)
    if record["status"]!="COMPLETED":
        raise HTTPException(409,"Report is not completed")
    file = files.get(record["fileId"])
    def stream():
        try:
            while chunk := file.read(65536):
                yield chunk
            db.reports.update_one({"_id":report_id},{"$set":{"downloadedAt":datetime.now(timezone.utc)}})
            audit(claims["sub"],"DESCARGAR_REPORTE","report",report_id)
        finally:
            file.close()
    return StreamingResponse(stream(),media_type="application/pdf",headers={"Content-Disposition":'attachment; filename="'+record["fileName"]+'"'})
