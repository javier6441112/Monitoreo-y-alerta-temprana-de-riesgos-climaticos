import hmac
import os
import httpx
import jwt
from fastapi import Depends, Header, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer = HTTPBearer(auto_error=False)
def required(name):
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing {name}")
    return value

def internal(x_service_key: str = Header(default="")):
    expected = required("SERVICE_KEY")
    if len(expected.encode()) < 32 or not hmac.compare_digest(x_service_key, expected):
        raise HTTPException(401, "Invalid service credentials")

def identity(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if credentials is None:
        raise HTTPException(401, "Bearer token required")
    try:
        claims = jwt.decode(credentials.credentials, required("JWT_KEY"), algorithms=["HS256"],
            issuer=required("JWT_ISSUER"), audience=required("JWT_AUDIENCE"),
            options={"require": ["exp", "sub", "jti", "iss", "aud", "role"]})
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")
    try:
        result = httpx.post(required("AUTH_URL") + "/internal/auth/introspect",
            headers={"X-Service-Key": required("SERVICE_KEY")}, json={"token": credentials.credentials}, timeout=8)
    except httpx.HTTPError:
        raise HTTPException(503, "Identity service unavailable")
    if result.status_code != 200 or not result.json().get("active"):
        raise HTTPException(401, "Inactive session")
    return claims

def admin(claims=Depends(identity)):
    if claims.get("role") != "ADMIN":
        raise HTTPException(403, "Administrator required")
    return claims

def permission(name, administrator=False):
    def check(claims=Depends(identity)):
        if name not in claims.get("permissions", []) or administrator and claims.get("role") != "ADMIN":
            raise HTTPException(403, "Insufficient permissions")
        return claims
    return check
