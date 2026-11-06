"""One-off transfer tool. Source is read-only; target services must be stopped."""
import argparse
import json
import os
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
import pytds
import psycopg
from psycopg.types.json import Jsonb
from pymongo import MongoClient

TABLES = ["Usuarios", "RevokedTokens", "Comunidades", "Sensores", "LecturasSensores", "ConfiguracionAlertas", "Alertas", "HistorialEventos", "Bitacora"]

def required(name):
    value = os.environ.get(name)
    if not value:
        raise RuntimeError("Missing " + name)
    return value

def normalized(rows):
    return [{key.lower(): value for key, value in row.items()} for row in rows]

def default(value):
    if isinstance(value, datetime):
        return value.replace(tzinfo=value.tzinfo or timezone.utc).isoformat()
    if isinstance(value, Decimal):
        return str(value)
    raise TypeError(type(value).__name__)

def date(value):
    if value is None:
        return None
    if isinstance(value, str):
        value = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return value.replace(tzinfo=value.tzinfo or timezone.utc)

def export_source():
    source = pytds.connect(required("LEGACY_SQL_HOST"), database=os.environ.get("LEGACY_SQL_DATABASE", "ClimateRiskDb"),
        user=required("LEGACY_SQL_USER"), password=required("LEGACY_SQL_PASSWORD"),
        port=int(os.environ.get("LEGACY_SQL_PORT", "1433")), as_dict=True, readonly=True)
    try:
        cursor = source.cursor()
        cursor.execute("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE")
        result = {}
        for table in TABLES:
            cursor.execute("SELECT OBJECT_ID(%s,'U') id", ("dbo." + table,))
            if cursor.fetchone()["id"] is None:
                result[table] = []
            else:
                cursor.execute("SELECT * FROM dbo.[" + table + "]")
                result[table] = normalized(cursor.fetchall())
        return result
    finally:
        source.rollback()
        source.close()

def validate(source):
    for table in TABLES:
        source.setdefault(table, [])
    communities = {int(row["id"]) for row in source["Comunidades"]}
    sensors = {int(row["id"]) for row in source["Sensores"]}
    users = source["Usuarios"]
    if not any(row.get("activo") and row.get("rol") == "ADMIN" for row in users):
        raise ValueError("Source requires an active administrator")
    for user in users:
        if not str(user.get("passwordhash", "")).startswith("PBKDF2$"):
            raise ValueError("Unsupported password hash; resolve before migration")
    if any(int(row["comunidadid"]) not in communities for row in source["Sensores"]):
        raise ValueError("Sensor references a missing community")
    for table in ["LecturasSensores", "Alertas", "HistorialEventos"]:
        if any(int(row["sensorid"]) not in sensors for row in source[table]):
            raise ValueError(table + " references a missing sensor")
    for table in TABLES:
        ids = [row.get("id", row.get("tokenid")) for row in source[table]]
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate source IDs in " + table)

def alert_payload(row, source):
    sensor = next(s for s in source["Sensores"] if s["id"] == row["sensorid"])
    community = next(c for c in source["Comunidades"] if c["id"] == sensor["comunidadid"])
    state = row.get("estado") or ("ACTIVA" if row.get("activa", True) else "CERRADA")
    return {"id": row["id"], "sensorId": row["sensorid"], "sensorNombre": sensor["nombre"],
        "comunidadId": sensor["comunidadid"], "comunidadNombre": community["nombre"],
        "configuracionAlertaId": row.get("configuracionalertaid"), "fenomeno": row["fenomeno"],
        "nivel": row["nivel"], "mensaje": row["mensaje"], "valorDetectado": float(row.get("valordetectado") or 0),
        "valorMinimo": float(row["valorminimo"]) if row.get("valorminimo") is not None else None,
        "valorMaximo": float(row["valormaximo"]) if row.get("valormaximo") is not None else None,
        "fechaHora": default(date(row["fechahora"])), "estado": state, "activa": state == "ACTIVA",
        "atendidaPorId": row.get("atendidaporid"), "cerradaPorId": row.get("cerradaporid"),
        "fechaAtencion": default(date(row["fechaatencion"])) if row.get("fechaatencion") else None,
        "fechaCierre": default(date(row["fechacierre"])) if row.get("fechacierre") else None}

def insert(cursor, table, columns, values):
    # Table/column names come only from fixed mappings below, never request input.
    cursor.execute("INSERT INTO " + table + "(" + ",".join(columns) + ") VALUES(" + ",".join(["%s"] * len(values)) + ")", values)

def transfer(source):
    validate(source)
    auth = psycopg.connect(required("AUTH_DATABASE_URL"))
    community = psycopg.connect(required("COMMUNITY_DATABASE_URL"))
    alert = psycopg.connect(required("ALERT_DATABASE_URL"))
    sensor = pytds.connect(required("SENSOR_SQL_HOST"), database="WeatherRiskSensors", user="sa",
        password=required("MSSQL_SA_PASSWORD"), port=1433)
    mongo = MongoClient(required("AUDIT_MONGO_URL"), serverSelectionTimeoutMS=5000, tz_aware=True)
    audit = mongo["audit"]
    connections = [auth, community, alert, sensor]
    try:
        checks = [(auth,"users"),(auth,"revoked_tokens"),(auth,"external_identities"),(community,"communities"),
                  (alert,"rules"),(alert,"alerts"),(alert,"events"),(sensor,"sensors"),(sensor,"readings"),(sensor,"evaluation_outbox")]
        for connection, table in checks:
            cursor = connection.cursor()
            cursor.execute("SELECT COUNT(*) FROM " + table)
            if cursor.fetchone()[0]:
                raise RuntimeError("Target is not empty: " + table + ". Use fresh targets; never overwrite live data.")
        if audit.events.count_documents({}):
            raise RuntimeError("Target audit database is not empty")
        a, c, s, r = auth.cursor(), community.cursor(), sensor.cursor(), alert.cursor()
        for row in source["Usuarios"]:
            insert(a, "users", ["id","username","password_hash","nombre","rol","activo","fecha_creacion","ultimo_acceso"],
                [row["id"],row["username"],row["passwordhash"],row["nombre"],row["rol"],bool(row["activo"]),date(row.get("fechacreacion")) or datetime.now(timezone.utc),date(row.get("ultimoacceso"))])
        for row in source["RevokedTokens"]:
            insert(a,"revoked_tokens",["token_id","expires_at"],[row["tokenid"],date(row["expiresatutc"])])
        for row in source["Comunidades"]:
            cols = ["id","nombre","municipio","departamento","pais","latitud","longitud","descripcion","activo"]
            insert(c, "communities", cols, [bool(row.get(col, True)) if col == "activo" else row.get(col) for col in cols])
        s.execute("SET IDENTITY_INSERT sensors ON")
        for row in source["Sensores"]:
            cols = ["id","nombre","codigo","tipo","unidad","comunidadId","latitud","longitud","activo","fechaInstalacion","descripcion","valorActual","ultimaLectura","fechaCreacion"]
            values = [row.get(col.lower()) for col in cols]
            values[2] = values[2] or "LEGACY-" + str(row["id"])
            values[13] = values[13] or datetime.now(timezone.utc)
            for i in [9, 12, 13]:
                value = date(values[i])
                values[i] = value.replace(tzinfo=None) if value else None
            insert(s,"sensors",cols,values)
        s.execute("SET IDENTITY_INSERT sensors OFF")
        s.execute("SET IDENTITY_INSERT readings ON")
        for row in source["LecturasSensores"]:
            insert(s,"readings",["id","sensorId","valor","fechaHora"],[row["id"],row["sensorid"],row["valor"],date(row["fechahora"]).replace(tzinfo=None)])
        s.execute("SET IDENTITY_INSERT readings OFF")
        for row in source["ConfiguracionAlertas"]:
            insert(r,"rules",["id","nombre","tipo_sensor","nivel","valor_minimo","valor_maximo","fenomeno","mensaje","activo"],
                [row["id"],row["nombre"],row["tiposensor"],row["nivel"],row.get("valorminimo"),row.get("valormaximo"),row["fenomeno"],row["mensaje"],bool(row["activo"])])
        for row in source["Alertas"]:
            payload = alert_payload(row,source)
            insert(r,"alerts",["id","sensor_id","comunidad_id","fecha_hora","estado","activa","payload"],
                [row["id"],row["sensorid"],payload["comunidadId"],date(row["fechahora"]),payload["estado"],payload["activa"],Jsonb(payload)])
        alert_ids = {row["id"] for row in source["Alertas"]}
        for row in source["HistorialEventos"]:
            payload = alert_payload(row,source)
            payload.update(alertaId=row.get("alertaid"),valor=None)
            insert(r,"events",["id","alert_id","sensor_id","comunidad_id","fecha_hora","payload"],
                [row["id"],row.get("alertaid") if row.get("alertaid") in alert_ids else None,row["sensorid"],payload["comunidadId"],date(row["fechahora"]),Jsonb(payload)])
        # Verify counts and password hashes before committing any relational target.
        for connection, table, legacy in [(auth,"users","Usuarios"),(auth,"revoked_tokens","RevokedTokens"),(community,"communities","Comunidades"),(sensor,"sensors","Sensores"),(sensor,"readings","LecturasSensores"),(alert,"rules","ConfiguracionAlertas"),(alert,"alerts","Alertas"),(alert,"events","HistorialEventos")]:
            cursor = connection.cursor()
            cursor.execute("SELECT COUNT(*) FROM " + table)
            if cursor.fetchone()[0] != len(source[legacy]):
                raise RuntimeError("Count mismatch: " + table)
        a.execute("SELECT id,password_hash FROM users")
        hashes = dict(a.fetchall())
        if any(hashes[row["id"]] != row["passwordhash"] for row in source["Usuarios"]):
            raise RuntimeError("Password hash mismatch")
        for cursor, table in [(a,"users"),(c,"communities"),(r,"rules"),(r,"alerts"),(r,"events")]:
            cursor.execute("SELECT setval(pg_get_serial_sequence(%s,'id'),COALESCE((SELECT MAX(id) FROM " + table + "),1),EXISTS(SELECT 1 FROM " + table + "))",(table,))
        sensor_max = max((row["id"] for row in source["Sensores"]),default=0)
        reading_max = max((row["id"] for row in source["LecturasSensores"]),default=0)
        # pytds closes the previous cursor when another cursor is created without MARS.
        s = sensor.cursor()
        # A never-populated identity table must keep its original seed (1).
        # RESEED 0 would make its first generated ID zero instead of one.
        if source["Sensores"]:
            s.execute("DBCC CHECKIDENT ('sensors', RESEED, " + str(int(sensor_max)) + ") WITH NO_INFOMSGS")
        if source["LecturasSensores"]:
            s.execute("DBCC CHECKIDENT ('readings', RESEED, " + str(int(reading_max)) + ") WITH NO_INFOMSGS")
        for row in source["Bitacora"]:
            audit.events.insert_one({"eventId":"legacy-bitacora-"+str(row["id"]),"legacyId":row["id"],"usuarioId":str(row.get("usuarioid") or "system"),
                "usuarioNombre":row.get("usuario") or "system","accion":row["accion"],"entidad":"legacy",
                "descripcion":row["descripcion"],"fechaHora":date(row["fechahora"])})
        if audit.events.count_documents({}) != len(source["Bitacora"]):
            raise RuntimeError("Audit count mismatch")
        for connection in connections:
            connection.commit()
        print("Transfer completed; counts and password hashes verified. Log in again: old tokens are not reused.")
    except Exception:
        for connection in connections:
            connection.rollback()
        # No distributed transaction spans PostgreSQL, SQL Server and MongoDB.
        # If any commit occurred or audit was written, restore fresh targets before retrying.
        raise
    finally:
        for connection in connections:
            connection.close()
        mongo.close()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, help="Previously exported JSON; omit to read legacy SQL")
    parser.add_argument("--output", type=Path, default=Path("/artifacts/legacy-export.json"))
    parser.add_argument("--apply", action="store_true", help="Write ONLY empty target databases")
    args = parser.parse_args()
    source = json.loads(args.input.read_text()) if args.input else export_source()
    source = {table:normalized(rows) for table,rows in source.items()}
    validate(source)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(source,default=default,ensure_ascii=False))
    print(json.dumps({table:len(rows) for table,rows in source.items()}))
    if args.apply:
        transfer(source)
    else:
        print("Dry run: export created, no target data changed. It contains password hashes; protect it.")

if __name__ == "__main__":
    main()
