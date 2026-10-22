# Regresión de la primera refactorización

Ejecutar desde la raíz:

```powershell
dotnet run --project Tests/Regression/WeatherRisk.Regression.csproj
dotnet build Backend/WeatherRisk.Api.csproj --no-restore
./scripts/verify-api.ps1
```

Si Windows bloquea scripts por la política de ejecución, ejecutar la comprobación con una excepción limitada al proceso, según las políticas del equipo:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-api.ps1
```

El ejecutable de regresión devuelve código distinto de cero si falla una comprobación. Usa el SDK .NET 10 y las dependencias existentes del backend, sin añadir un framework de pruebas. Comprueba DI, emisión real de JWT, rechazo de credenciales, usuarios, normalización, edición de sensores, validación de lecturas, reglas, escritura de alertas/auditoría/historial, notificaciones y dashboard.

Los repositorios se sustituyen por dobles que rechazan llamadas inesperadas. No prueba traducción SQL, restricciones, transacciones, consultas persistentes ni concurrencia. La prueba HTTP arranca la aplicación real en un puerto local, comprueba salud, rutas OpenAPI y respuestas 401, y detiene solo el proceso que creó. Usa `-Port` si 5087 está ocupado. Los logs quedan en el directorio temporal.

La integración con SQL Server, login HTTP real y flujos CRUD persistentes sigue pendiente. No se debe interpretar esta suite como evidencia de funcionamiento del VPS o de microservicios aún no creados.
