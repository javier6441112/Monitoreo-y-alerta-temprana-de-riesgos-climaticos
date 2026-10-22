import logging
import uuid
from datetime import datetime, timezone
import httpx
from fastapi import HTTPException
from common.security import required

def get(service, path, params=None):
    try:
        response = httpx.get(required(service) + path, headers={"X-Service-Key": required("SERVICE_KEY")},
                             params=params, timeout=15)
        response.raise_for_status()
        return response.json()
    except (httpx.HTTPError, ValueError):
        raise HTTPException(503, "Data service unavailable")

def audit(actor, action, entity, entity_id=None):
    try:
        result = httpx.post(required("AUDIT_URL") + "/internal/audit/events", headers={"X-Service-Key": required("SERVICE_KEY")},
            json={"eventId": str(uuid.uuid4()), "usuarioId": actor, "accion": action, "entidad": entity,
                  "entidadId": entity_id, "descripcion": action, "fechaHora": datetime.now(timezone.utc).isoformat()}, timeout=5)
        result.raise_for_status()
    except httpx.HTTPError:
        logging.exception("Audit delivery failed")
