from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field, ConfigDict
from pymongo import MongoClient, DESCENDING
from pymongo.errors import DuplicateKeyError
from common.security import internal, admin, required
from common.errors import install_errors

client = MongoClient(required("MONGO_URL"), serverSelectionTimeoutMS=5000, tz_aware=True)
db = client[required("MONGO_DATABASE")]

@asynccontextmanager
async def lifespan(app):
    db.events.create_index("eventId", unique=True)
    db.events.create_index([("fechaHora", DESCENDING)])
    yield
    client.close()

app = FastAPI(title="Weather Risk Audit", lifespan=lifespan)
install_errors(app)
class Event(BaseModel):
    model_config = ConfigDict(extra="forbid")
    eventId: str = Field(min_length=1, max_length=100)
    usuarioId: str | int | None = None
    usuarioNombre: str | None = None
    accion: str = Field(min_length=1, max_length=100)
    entidad: str = Field(min_length=1, max_length=100)
    entidadId: Any = None
    descripcion: str = Field(default="", max_length=1000)
    fechaHora: datetime

@app.get("/health")
def health():
    return {"status": "ok", "service": "audit"}

@app.get("/ready")
def ready():
    client.admin.command("ping")
    return {"status": "ok"}

@app.post("/internal/audit/events", dependencies=[Depends(internal)])
def ingest(event: Event):
    record = event.model_dump()
    record["usuarioNombre"] = record["usuarioNombre"] or str(record["usuarioId"] or "system")
    record["fechaHora"] = event.fechaHora.astimezone(timezone.utc)
    try:
        result = db.events.insert_one(record)
        return {"id": str(result.inserted_id)}
    except DuplicateKeyError:
        return {"id": str(db.events.find_one({"eventId": event.eventId})["_id"])}

@app.get("/api/bitacora", dependencies=[Depends(admin)])
@app.get("/api/audit", dependencies=[Depends(admin)])
def events(desde: datetime | None = None, hasta: datetime | None = None, usuarioId: str | None = None,
           accion: str | None = None, entidad: str | None = None, page: int = Query(1, ge=1),
           pageSize: int = Query(200, ge=1, le=200)):
    query = {}
    if desde or hasta:
        query["fechaHora"] = {}
        if desde:
            query["fechaHora"]["$gte"] = desde
        if hasta:
            query["fechaHora"]["$lte"] = hasta
    if desde and hasta and desde > hasta:
        raise HTTPException(400, "Invalid date range")
    for key, value in [("usuarioId", usuarioId), ("accion", accion), ("entidad", entidad)]:
        if value is not None:
            query[key] = value
    rows = list(db.events.find(query).sort("fechaHora", -1).skip((page-1)*pageSize).limit(pageSize))
    for row in rows:
        row["id"] = str(row.pop("_id"))
    return jsonable_encoder(rows)
