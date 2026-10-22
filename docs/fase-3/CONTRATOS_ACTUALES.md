# Inventario HTTP y línea base

> Inventario histórico del monolito usado para preservar compatibilidad. Las rutas activas, cambios explícitos y contratos nuevos se describen en [Microservicios](MICROSERVICIOS.md).

Inventario de los controladores existentes al comenzar fase 3. Las rutas se muestran en minúsculas como las consume Angular. Se conservan en la primera refactorización. Las rutas inglesas del esquema de fase 3 se incorporarán como alias o adaptación explícita en Gateway, sin romper el frontend actual.

## Endpoints existentes

Todas las rutas `/api` requieren autenticación salvo login. Las restricciones adicionales se indican en la tabla. Los DTO completos están en `Backend/DTOs`; el inventario enumera sus nombres para no duplicar sus definiciones.

| Dominio futuro | Método y ruta | Entrada / filtros | Respuesta actual | Restricción adicional |
|---|---|---|---|---|
| Auth | POST `/api/auth/login` | LoginRequestDto | LoginResponseDto | Anónimo |
| Auth | POST `/api/auth/logout` | Bearer JWT | 204 | Ninguna |
| Auth | GET `/api/auth/me` | Bearer JWT | UsuarioSummaryDto | Ninguna |
| Auth | GET `/api/usuarios` | buscar, rol, activo | UsuarioDto[] | ADMIN |
| Auth | GET `/api/usuarios/roles` | — | string[] | ADMIN |
| Auth | GET `/api/usuarios/{id}` | id | UsuarioDto | ADMIN |
| Auth | POST `/api/usuarios` | CreateUsuarioRequestDto | 201 UsuarioDto | ADMIN |
| Auth | PUT `/api/usuarios/{id}` | UpdateUsuarioRequestDto | UsuarioDto | ADMIN |
| Auth | PATCH `/api/usuarios/{id}/estado` | UpdateUsuarioEstadoRequestDto | UsuarioDto | ADMIN |
| Community | GET `/api/comunidades` | buscar, activo, municipio, departamento | ComunidadDto[] | Ninguna |
| Community | GET `/api/comunidades/{id}` | id | ComunidadDto | Ninguna |
| Community | POST `/api/comunidades` | CreateComunidadRequestDto | 201 ComunidadDto | ADMIN |
| Community | PUT `/api/comunidades/{id}` | UpdateComunidadRequestDto | ComunidadDto | ADMIN |
| Community | PATCH `/api/comunidades/{id}/estado` | UpdateComunidadEstadoRequestDto | 204 | ADMIN |
| Sensor | GET `/api/sensores` | codigo, tipo, activo, comunidadId, buscar | SensorDto[] | Ninguna |
| Sensor | GET `/api/sensores/{id}` | id | SensorDto | Ninguna |
| Sensor | POST `/api/sensores` | CreateSensorRequestDto | 201 SensorDto | ADMIN u OPERADOR |
| Sensor | PUT `/api/sensores/{id}` | UpdateSensorRequestDto | SensorDto | ADMIN u OPERADOR |
| Sensor | PATCH `/api/sensores/{id}/estado` | UpdateSensorEstadoRequestDto | status, message, data | ADMIN u OPERADOR |
| Sensor | DELETE `/api/sensores/{id}` | id | 204 | ADMIN |
| Sensor | GET `/api/lecturas` | sensorId, comunidadId, desde, hasta | LecturaDto[] | Ninguna |
| Sensor | POST `/api/lecturas` | CreateLecturaRequestDto | LecturaDto | ADMIN u OPERADOR |
| Sensor | POST `/api/monitoreo/reiniciar` | — | Mensaje de resultado | ADMIN |
| Alert | GET `/api/alertas` | activas, desde, hasta, comunidadId, sensorId, fenomeno, nivel, estado | AlertaDto[] | Ninguna |
| Alert | GET `/api/alertas/activas` | — | AlertaDto[] | Ninguna |
| Alert | PATCH `/api/alertas/{id}/estado` | ChangeAlertStateRequestDto | AlertaDto | ADMIN u OPERADOR |
| Alert | POST `/api/alertas/{id}/cerrar` | id | id, activa | ADMIN u OPERADOR |
| Alert | GET `/api/configuracionalertas` | tipoSensor, activo | ConfiguracionAlertaDto[] | Ninguna |
| Alert | GET `/api/configuracionalertas/{id}` | id | ConfiguracionAlertaDto | Ninguna |
| Alert | POST `/api/configuracionalertas` | CreateConfiguracionAlertaRequestDto | 201 ConfiguracionAlertaDto | ADMIN |
| Alert | PUT `/api/configuracionalertas/{id}` | UpdateConfiguracionAlertaRequestDto | ConfiguracionAlertaDto | ADMIN |
| Alert | PATCH `/api/configuracionalertas/{id}/estado` | UpdateConfiguracionAlertaEstadoRequestDto | ConfiguracionAlertaDto | ADMIN |
| Alert | DELETE `/api/configuracionalertas/{id}` | id | 204 | ADMIN |
| Alert | GET `/api/historial` | desde, hasta, comunidadId, sensorId, fenomeno, nivel | HistorialDto[] | Ninguna |
| Alert | GET `/api/historial/estadisticas` | mismos filtros | EstadisticasHistorialDto | Ninguna |
| Audit | GET `/api/bitacora` | Sin filtros en controlador | Bitacora[] | Ninguna; restringir política pendiente |
| Composición | GET `/api/dashboard` | comunidadId, desde, hasta | DashboardDto | Ninguna |
| Composición | GET `/api/dashboard/series` | mismos filtros | DashboardSeriesDto[] | Ninguna |

Otros endpoints: `/health` y `/` son públicos; `/swagger` publica la descripción OpenAPI. El hub `/hubs/monitoreo` publica `lecturaActualizada` y `alertaGenerada`; su protección está pendiente.

## Flujos que se deben conservar

Modelos persistentes actuales: `Usuario`, `RevokedToken` (Auth); `Comunidad` (Community); `Sensor`, `LecturaSensor` (Sensor); `ConfiguracionAlerta`, `Alerta`, `HistorialEvento` (Alert); `Bitacora` (Audit). Todos siguen dentro de `WeatherDbContext` en esta etapa. Report aún no tiene modelos ni endpoints implementados.

1. **Login:** buscar usuario, rechazar inexistente/inactivo/contraseña incorrecta, actualizar último acceso, emitir JWT con rol y `jti`. Logout registra revocación hasta la expiración.
2. **Comunidades:** recortar textos de solicitudes de creación y edición; conservar filtros, coordenadas y estado.
3. **Sensores:** conservar filtros y metadatos; al editar no sobrescribir lectura actual ni última lectura; `activo` omitido conserva su valor previo.
4. **Lecturas:** rechazar sensor inexistente o inactivo y tipos sin reglas activas; registrar lectura, actualizar sensor, evaluar reglas y publicar actualización SignalR.
5. **Alertas:** seleccionar regla activa con límites inclusivos, ordenando por mínimo descendente; registrar alerta con valores/umbrales, auditoría e historial vinculado, y notificar por SignalR.
6. **Historial:** conservar filtros y agrupación por nivel y fenómeno.
7. **Dashboard:** conservar forma de métricas y series. La lógica actual usa el primer sensor de cada tipo, no promedios climáticos.

## Formatos y evolución del contrato

Actual: JSON con camelCase; listas sin paginación; filtros de fecha inclusivos; errores heterogéneos entre respuestas vacías y objetos `{status, message, errors?}`. No existe un límite uniforme de consultas ni contrato de error global. Los modelos almacenan `DateTime` y usan `UtcNow` al registrar eventos, pero la normalización de fechas recibidas no está centralizada.

Para las nuevas APIs internas se define: fechas ISO 8601 en UTC, intervalos validados, IDs estables y errores `application/problem+json` con `status`, `title`, `detail`, `instance` y `traceId`. Consultas voluminosas usarán `{items, page, pageSize, total}` con página desde 1, tamaño predeterminado 50 y máximo 200. Son decisiones previstas; no se cambia el formato de listas actuales en esta etapa. Las adaptaciones públicas se harán en Gateway o mediante una versión explícita y actualización del cliente.

## Inventario de código y discrepancias conocidas

Entrada activa de Angular: `main.ts` → `app.config.ts` → `app.routes.ts`. El servicio activo del dashboard es `core/services/dashboard/dashboard.service.ts`; `core/services/dashboard.ts` es una clase vacía. Hay módulos, componentes y servicios paralelos que requieren un análisis de referencias antes de retirarlos.

El backend registraba únicamente `SqlWeatherRepository` en DI. El repositorio de memoria `WeatherRepository` no tenía consumidores en el código productivo y se retiró junto con la interfaz general tras separar sus responsabilidades. `Services/SensorsService.cs` es un archivo vacío, pendiente de limpieza junto con otros archivos sin uso.

Pendientes funcionales que esta extracción no corrige:

- `Lectura.estadoSensor` se declara boolean en el contrato Angular y se devuelve como texto `ACTIVO`/`INACTIVO` desde backend.
- `DashboardDto` expone campos adicionales como comunidades, sensores inactivos, distribuciones y eventos, pero `DashboardService` no los completa y devuelve sus valores predeterminados.
- La API de bitácora devuelve entidades y no aplica filtros del servicio ni la restricción ADMIN de la interfaz.
- El conteo de sensores de comunidades depende de una navegación que no se carga explícitamente.
- El nivel general del dashboard puede sobrescribir un nivel alto de río con amarillo por viento.
- El historial proyecta estado fijo `ACTIVA` y valor nulo.
- Reiniciar monitoreo solamente escribe una entrada de bitácora.

## Verificación de este incremento

- Compilación inicial: `dotnet build Backend/WeatherRisk.Api.csproj --no-restore` pasó sin errores ni advertencias.
- Las pruebas de regresión de aplicación se ejecutan con `dotnet run --project Tests/Regression/WeatherRisk.Regression.csproj` y usan dobles de persistencia, sin modificar bases de datos.
- La prueba HTTP de arranque se ejecuta con `./scripts/verify-api.ps1`; no acredita las consultas a SQL Server.
- No se obtuvo una línea base integral con base de datos: Docker no estuvo disponible en la sesión. Login HTTP real, CRUD persistente, migraciones y despliegue siguen pendientes de comprobación.
- Resultado del incremento: nueve escenarios de regresión aprobados y comprobación HTTP de salud, rutas principales y rechazo 401 completada. Estas comprobaciones no consultan SQL Server.
