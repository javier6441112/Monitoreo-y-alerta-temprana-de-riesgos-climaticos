from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

def install_errors(app):
    @app.exception_handler(HTTPException)
    async def rejected(request, error):
        return JSONResponse(status_code=error.status_code, media_type="application/problem+json",
            content={"status":error.status_code,"title":"Request rejected","detail":str(error.detail),"instance":request.url.path})
    @app.exception_handler(RequestValidationError)
    async def invalid(request, error):
        errors=[{"loc":list(item["loc"]),"message":item["msg"]} for item in error.errors()]
        return JSONResponse(status_code=422, media_type="application/problem+json",
            content={"status":422,"title":"Invalid request","errors":errors,"instance":request.url.path})
