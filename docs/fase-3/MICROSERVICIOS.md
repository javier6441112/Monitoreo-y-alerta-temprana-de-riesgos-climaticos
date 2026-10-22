# Microservicios — implementación y operación

## Estado actual

La arquitectura activa de `docker-compose.yml` ejecuta Gateway y seis aplicaciones independientes. No usa el backend monolítico como destino ni comparte su DbContext. Angular conserva sus rutas y consume Nginx → Gateway → APIs. `Backend/` y `docker-compose.legacy.yml` quedan como referencia de la versión anterior.

| Componente | Código | Tecnología | Datos propios |
|---|---|---|---|
| Gateway | Gateway/ | .NET 10, YARP | Sin base de datos; compone dashboard por HTTP |
| Auth | Services/Auth/ | NestJS, TypeScript, Node 24 | PostgreSQL: usuarios, roles, permisos, revocación e identidades externas |
| Community | Services/Community/ | C#, .NET 10 | PostgreSQL: comunidades y geografía |
| Sensor | Services/Sensor/ | C#, .NET 10 | SQL Server 2022: sensores, lecturas, configuración de simulación y outbox |
| Alert | Services/Alert/ | Java 21, Spring Boot | PostgreSQL: reglas, alertas, eventos y recibos de evaluación |
| Report | Services/Report/ | Python, FastAPI, Jinja2, WeasyPrint | MongoDB: metadatos y archivos PDF en GridFS |
| Audit | Services/Audit/ | Python, FastAPI | MongoDB: acciones auditadas |

Auth, Community y Alert usan instancias PostgreSQL distintas. Report y Audit tienen bases y usuarios MongoDB distintos. Cada aplicación recibe solamente su conexión de persistencia. El importador de `Tools/Migration/` es una herramienta administrativa de una sola ejecución y, a diferencia de los servicios, accede a varias bases para copiar datos.

## Arranque

Requiere Docker Desktop con contenedores Linux o Docker Engine/Compose en GNU/Linux. Para los scripts de verificación se usa Node 24. No es necesario instalar Java, Python o Maven en el host.

En una instalación nueva:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/init-env.ps1
docker compose up -d --build --wait --wait-timeout 240
```

En esta máquina ya se creó `.env`; el inicializador rechaza sobrescribirlo. Los secretos se generan aleatoriamente y no se muestran en consola. Para GNU/Linux, crear `.env` a partir de `.env.example` con valores reales y claves distintas de al menos 32 bytes. Contraseñas usadas en URI deben codificarse; el generador utiliza hexadecimal para evitar caracteres reservados.

- Aplicación: http://localhost:4200
- Reportes: http://localhost:4200/reportes
- Gateway: http://localhost:5000
- Salud: `/health`; disponibilidad: `/ready`.

Únicamente se publican frontend y Gateway, enlazados a localhost de forma predeterminada. Los servicios y bases quedan en una red interna. `BIND_ADDRESS`, `API_PORT`, `FRONTEND_PORT` y `CORS_ORIGINS` se configuran por entorno.

**Credenciales:** `ADMIN_PASSWORD` inicializa exclusivamente un usuario en una base vacía. No cambia la contraseña de un usuario existente. En esta máquina se importaron los usuarios anteriores: se utilizan sus contraseñas anteriores. No se guardaron sus contraseñas en texto plano ni se restablecieron. Hay que iniciar sesión otra vez porque cambió el emisor JWT.

`DATA_VOLUME_PREFIX` selecciona los volúmenes. La instalación local migrada usa `climate-phase3-migrated`; los volúmenes de las pruebas y el volumen original del monolito se conservaron.

## Contratos públicos

Las rutas actuales y sus DTO se enumeran en [CONTRATOS_ACTUALES.md](CONTRATOS_ACTUALES.md), que documenta la línea base del monolito. La nueva arquitectura mantiene esas rutas con estos cambios explícitos:

- `/api/auth/*`, `/api/usuarios/*` y `/api/roles/*` van a Auth.
- `/api/comunidades/*` va a Community; `/api/communities/*` es un alias.
- `/api/sensores/*`, `/api/lecturas/*`, `/api/monitoreo/*` y `/hubs/monitoreo` van a Sensor. `/api/sensors/*` es un alias de sensores.
- `/api/alertas/*`, `/api/configuracionalertas/*` y `/api/historial/*` van a Alert. `/api/alerts/*` es un alias de alertas.
- `/api/reports/*` va a Report.
- `/api/bitacora` y `/api/audit` van a Audit y requieren ADMIN; ahora devuelven DTO con filtros.
- `/api/dashboard` y `/api/dashboard/series` se componen en Gateway mediante APIs.

Las consultas existentes siguen devolviendo listas. Las consultas internas de comunidades, sensores, lecturas, alertas y eventos aceptan `page` y `pageSize`, con páginas desde 1 y tamaño máximo 200. Los filtros conservan sus nombres, límites de fecha inclusivos y valores ISO 8601. Los errores de aplicación usan `application/problem+json`; los rechazos de autenticación pueden no incluir cuerpo. Gateway devuelve 429 al exceder el límite, y 502/503 ante dependencias indisponibles.

El dashboard ahora calcula promedios por tipo, distribución por nivel, comunidades, inactivos y eventos recientes. Su nivel general toma el mayor nivel de las alertas activas, evitando que viento amarillo sobrescriba rojo de río. Los valores cero representan ausencia de lecturas o sensores; no constituyen una observación física.

### Reporterías

`POST /api/reports` genera el PDF en backend y devuelve 201 con sus metadatos:

```json
{
  "type": "READINGS",
  "filters": {
    "comunidadId": 1,
    "sensorId": 2,
    "desde": "2026-10-01T00:00:00Z",
    "hasta": "2026-10-21T23:59:59Z",
    "tipo": "HUMEDAD"
  }
}
```

Tipos: `COMMUNITIES`, `SENSORS`, `READINGS`, `ALERTS`, `EVENTS`, `SENSOR_STATUS`, `CLIMATE_STATISTICS` y `EXECUTIVE`. Los filtros de alertas/eventos incluyen `fenomeno` y `nivel`. La interfaz muestra los filtros aplicables a cada reporte.

`Idempotency-Key` es opcional: la misma clave, usuario y parámetros devuelve el mismo registro; una clave reutilizada con otros parámetros responde 409.

| Operación | Ruta | Respuesta |
|---|---|---|
| Historial | GET /api/reports?page=1&pageSize=20 | items, page, pageSize, total |
| Detalle | GET /api/reports/{id} | Metadatos |
| Descarga | GET /api/reports/{id}/download | application/pdf y Content-Disposition |

Metadatos: id/reportId, type, generatedBy, generatedByName, generatedAt, filters, status, fileName, rowCount y downloadedAt. Estados: GENERATING, COMPLETED y FAILED. GridFS conserva los archivos fuera del contenedor; la fecha de descarga se registra después de completar la lectura del archivo.

La obtención de datos utiliza lotes de 200 y un máximo de 10 000 registros por conjunto. Si se excede se rechaza con 413 y se pide acotar filtros. La generación es síncrona y aún necesita pruebas de carga y una cola para volúmenes superiores. Lluvia en mm/h se integra por intervalos entre lecturas de cada sensor; no se suman tasas como si fueran cantidades acumuladas. Los períodos sin muestras no se interpolan.

## Seguridad y comunicación interna

- Auth emite HS256 con issuer `WeatherRisk.Auth`, audience `WeatherRisk`, sub, jti, role, permissions, version y expiración de ocho horas.
- Gateway y servicios validan firma, algoritmo, issuer, audience y expiración. Además consultan la revocación y el estado del usuario en Auth por HTTP; una indisponibilidad de identidad bloquea la operación protegida.
- Cambiar usuario, rol, contraseña o estado incrementa token_version e invalida tokens existentes. Modificar permisos de un rol invalida las sesiones de ese rol.
- Roles conservados: ADMIN, OPERADOR y CONSULTA. ADMIN recibe inicialmente `reports:generate`, `reports:read` y `reports:download`. `PUT /api/roles/{role}/permissions` permite administrarlos. La descarga exige también ADMIN.
- Los servicios hablan mediante `/internal/*`, protegidos con una clave de servicio y no publicados por Gateway. Gateway elimina cualquier X-Service-Key enviado por el navegador. Los reportes consultan APIs; no abren conexiones SQL ajenas.
- SignalR valida JWT tanto en negociación como en WebSocket. Los logs de Nginx omiten la query y se reduce el logging de URI en hosting/YARP para evitar registrar access_token.
- El renderizador PDF no puede descargar recursos HTTP ni abrir rutas de archivos suministradas por el usuario. Las tablas se escapan con Jinja2.

Para fase 4: cambiar a firma asimétrica con rotación/JWKS y OAuth/OIDC externo. El modelo external_identities ya reserva proveedor y sujeto por usuario; no existe todavía login externo. El uso actual de HS256 y una clave interna compartida exige proteger los secretos de todos los servicios. Separar contraseñas PostgreSQL y credenciales por llamante refuerza el aislamiento ante compromiso de un servicio.

## Lecturas, alertas y simulación

Una lectura comprueba sensor, actividad y existencia de reglas. En una transacción SQL se guardan la lectura, el último valor y un registro en evaluation_outbox. Un worker reclama el trabajo con bloqueo/lease, llama a Alert y reintenta si falla. Alert usa reading_id único para evitar duplicar alertas al recibir una evaluación repetida y conserva umbrales aplicados. La lectura y su alerta tienen consistencia eventual.

Los niveles admitidos son VERDE, AMARILLO, NARANJA y ROJO. El motor acepta reglas por tipo para los cinco fenómenos solicitados. Las seis reglas importadas cubren inundación y tormenta; queda completar y validar la configuración de sequía, helada e incendio forestal. Las reglas son configurables y no sustituyen criterios meteorológicos validados.

La simulación está apagada por defecto. `POST /api/monitoreo/reiniciar` la habilita; `PATCH /api/monitoreo/estado` con `{"activo":false}` la detiene. Su estado se guarda en SQL. Los sensores activos sin lectura en quince minutos se consideran SIN_COMUNICACION. Para múltiples réplicas aún se debe coordinar un único simulador y distribuir eventos SignalR mediante backplane.

La auditoría se envía por HTTP con eventId único. Si Audit no responde, los servicios registran el fallo; aún falta una outbox de auditoría para garantizar entrega. Las escrituras locales de alertas/eventos sí son transaccionales.

## Traslado ejecutado en esta máquina

Se encontró el contenedor anterior detenido y el volumen `climate-risk-sqlserver-data`. Se copió montándolo en modo solo lectura a `climate-phase3-legacy-snapshot-20261021`. SQL Server se inició únicamente sobre la copia, cuyos permisos se adaptaron sin modificar el origen.

El exportador leyó y validó relaciones y hashes; después se importó en volúmenes nuevos, con aplicaciones detenidas y sin usuarios de bootstrap. Resultado:

| Dato | Origen | Destino |
|---|---:|---:|
| Usuarios | 2 | 2 |
| Comunidades | 1 | 1 |
| Sensores | 5 | 5 |
| Reglas | 6 | 6 |
| Lecturas, alertas y eventos | 0 | 0 |
| Revocaciones y bitácora | 0 | 0 |

Se comprobaron cantidades, IDs por API y hashes de contraseña idénticos. El contenedor de la copia quedó detenido. Los exportados están en artifacts/ y contienen hashes: son material privado, excluido de Git, y no deben adjuntarse a la entrega.

### Repetir el procedimiento en otro entorno

1. Detener escrituras del monolito y respaldar su base. Mantener el origen disponible para reversión.
2. Configurar credenciales LEGACY_SQL_* en un archivo privado de entorno. No usar contraseñas en el historial de comandos.
3. Seleccionar un DATA_VOLUME_PREFIX nuevo. Arrancar destinos con `docker-compose.bootstrap-migration.yml` para evitar usuarios de bootstrap. Al cambiar volúmenes, recrear todos los contenedores para inicializar esquemas:

```powershell
docker compose -f docker-compose.yml -f docker-compose.bootstrap-migration.yml up -d --force-recreate --wait
```

4. Exportar sin escribir destinos:

```powershell
docker compose --env-file .env --env-file .env.migration-source -f docker-compose.yml -f docker-compose.migration.yml run --rm --no-deps migrate --output /artifacts/legacy-export.json
```

5. Detener las aplicaciones y conservar las bases encendidas. Ejecutar la importación solo sobre destinos vacíos:

```powershell
docker compose stop frontend gateway auth community sensor alert report audit
docker compose -f docker-compose.yml -f docker-compose.migration.yml run --rm --no-deps migrate --input /artifacts/legacy-export.json --output /artifacts/legacy-export-verified.json --apply
docker compose up -d --wait
```

El importador rechaza destinos no vacíos y conserva IDs; reseña secuencias para nuevas inserciones. Las transacciones relacionales se validan antes de commit. No existe una transacción distribuida entre todos los gestores: si un fallo ocurre después de algún commit o escritura Mongo, restaurar destinos nuevos antes de repetir. Nunca limpiar automáticamente una base en uso.

Reversión antes de aceptar escrituras nuevas: restaurar configuración/volúmenes anteriores y las rutas del despliegue legacy. El frontend legacy utiliza nginx.legacy.conf. Después de aceptar nuevas escrituras, se necesita reconciliarlas; volver al origen sin hacerlo perdería cambios. En esta máquina .env.integration-backup conserva la selección de los volúmenes de pruebas, y el volumen original del monolito permanece intacto.

## Verificación realizada

- Compilación de los siete proyectos/aplicaciones y del frontend en Docker; pruebas Maven de umbrales y prueba Node de PBKDF2.
- Once grupos de integración real, incluyendo login, JWT inválido/expirado, permisos, PostgreSQL, SQL Server, SignalR WebSocket, outbox/evaluación, historial, dashboard, auditoría y ocho PDF con descarga/idempotencia.
- Reinicio completo de contenedores: conservación de comunidades, sensores, lecturas, metadatos y ocho archivos PDF.
- Alert detenido temporalmente: /ready de Gateway respondió 503; la consulta falló y el reporte quedó FAILED. Se restauraron todos los servicios.
- Dos pruebas del importador y traslado real del volumen anterior con comprobación de cantidades y hashes.
- Verificación de los datos migrados por API y ocho PDF adicionales generados desde esos datos.

Comandos de verificación:

```powershell
node scripts/verify-microservices.mjs
node scripts/verify-persistence.mjs
docker compose exec -T report python -m unittest test_reports -v
docker compose ps
```

Los dos primeros scripts crean o consultan datos de pruebas y necesitan credenciales válidas: INTEGRATION_USERNAME e INTEGRATION_PASSWORD pueden sustituir las credenciales de bootstrap. No son scripts de mantenimiento para ejecutar indiscriminadamente en producción. verify-persistence usa los IDs de artifacts/integration-results.json y corresponde al conjunto usado por la integración.

verify-migrated.mjs es una comprobación puntual posimportación: usa la clave local para firmar un JWT administrativo temporal sin cambiar contraseñas. No incorpora un endpoint de acceso alternativo en las aplicaciones ni debe ejecutarse sobre un entorno ajeno. Sus resultados están en artifacts/migration-results.json. Los PDF de muestra no contienen secretos de autenticación.

## Pendientes de cierre de fase

VPS, dominio, certificados HTTPS y renovación; actualización Angular 20 a 22+; catálogo y demostración de todos los fenómenos; pruebas de carga; auditoría durable; coordinación de simulación/SignalR al escalar; backups y restauración de todos los gestores; revisión de código frontend duplicado; capturas y defensa individual. La lista de seguimiento está en [TAREAS_FASE_3.md](../../TAREAS_FASE_3.md).

Referencia de APIs de las tecnologías usadas: [YARP y autorización](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/authn-authz?view=aspnetcore-10.0), [Spring Security JWT](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html), [NestJS Guards](https://docs.nestjs.com/guards), [FastAPI lifespan](https://fastapi.tiangolo.com/advanced/events/), [MongoDB GridFS](https://www.mongodb.com/docs/languages/python/pymongo-driver/current/crud/gridfs/).
