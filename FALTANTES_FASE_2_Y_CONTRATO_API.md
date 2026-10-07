# Faltantes de Fase 2 y contrato API

Este documento contrasta los requisitos de `phase_2.md` con el código presente en el repositorio y propone un contrato común para que backend y frontend puedan avanzar en paralelo. El apartado de infraestructura se limita a Docker y Docker Compose; no incluye VPS, dominio ni HTTPS.

## Estado general

La base de la aplicación ya existe: API .NET 10, Angular 20, SQL Server, JWT, SignalR y Compose con servicios de base de datos, API y frontend. No equivale todavía a completar la fase: el mayor faltante estructural es la gestión de comunidades, y hay diferencias entre los requisitos, el backend y lo que Angular consume.

La documentación de referencia menciona Angular 22+, pero el proyecto usa Angular 20 (`frontend/package.json`). Para esta fase se toma el código actual como línea base y se registra la versión objetivo como decisión pendiente, no como funcionalidad faltante.

## Faltantes priorizados

### Backend

**Prioridad crítica: corregir antes de ampliar el panel administrativo**

- **Contraseñas sin hashing efectivo.** `AuthService` compara `PasswordHash` directamente con la contraseña recibida; además, los usuarios semilla usan `admin123` y `operador123` como valor almacenado. Debe usarse un hash de contraseña verificable y migrar las credenciales existentes.
- **Exposición de entidad de usuario.** `GET /api/usuarios` devuelve entidades `Usuario`, que incluyen `PasswordHash`. Crear un DTO de respuesta que nunca incluya contraseña ni hash.
- **Configuración de JWT de desarrollo.** Hay una clave de firma fija en `Backend/appsettings.json`; Compose no la reemplaza por una variable de entorno. Mover claves y credenciales fuera del repositorio y fallar de forma segura si falta configuración.
- **Roles incompletos.** Se usan `ADMIN` y `OPERADOR`, pero falta `CONSULTA`. La mayoría de controladores solo requieren `[Authorize]`, sin permisos por operación. Definir y aplicar la matriz ADMIN/OPERADOR/CONSULTA.
- **Rutas privadas no protegidas en Angular.** Hay guards, pero el guard funcional devuelve `true` y no está aplicado a las rutas. La autorización real debe permanecer en backend; frontend también debe ocultar/bloquear navegación por sesión y rol.

**Funcionalidad de fase pendiente o parcial**

- **Comunidades completas:** no hay modelo, `DbSet`, tabla SQL, servicio, controlador ni endpoints. Los sensores tienen `ComunidadId`, pero no hay entidad relacionada ni integridad referencial; los datos semilla referencian la comunidad `1` sin crearla.
- **Sensores:** existen operaciones de listar/obtener/crear/editar/cambiar estado/eliminar, pero faltan filtros por comunidad, tipo, estado y código. El DTO no contempla código, ubicación, fecha de instalación ni descripción. La regla de que sensores inactivos no reciban lecturas ni generen alertas debe validarse en el servicio.
- **Lecturas:** hay consulta por sensor y fechas, más registro de valor; falta filtro directo por comunidad y la respuesta no expone unidad ni estado del sensor. Verificar que no se acepten lecturas de sensores inactivos. El dashboard debe consumir estas lecturas para series históricas.
- **Reglas:** `ConfiguracionAlerta` permite CRUD y filtro por tipo, pero solo tiene umbral mínimo; falta máximo según requisitos. A las alertas generadas les falta el identificador de la regla que las originó.
- **Alertas:** hay listado, filtro booleano de activas y cierre binario. Faltan detalle, filtros por fecha/comunidad/sensor/fenómeno/nivel/estado, estados `ACTIVA`, `ATENDIDA`, `CERRADA`, responsable de atención/cierre y datos completos de umbral/comunidad/regla.
- **Historial:** existe listado sin parámetros de filtro. El modelo carece de valor detectado, estado, comunidad y responsable; falta endpoint de estadísticas. El servicio Angular envía `sensorId`, pero el controlador actual no lo recibe ni filtra.
- **Usuarios:** solo está implementado `GET /api/usuarios`; faltan detalle, creación, edición, activación/desactivación, asignación de roles y filtros. La respuesta debe usar DTOs seguros y exponer fecha de creación/último acceso/estado/rol.
- **Bitácora:** hay consulta sin filtros y protegida para cualquier usuario autenticado; debe limitarse a ADMIN, filtrar por usuario/acción/fecha/entidad y registrar operaciones CRUD, login/logout, cambios de estado y gestión de alertas. Hoy la evaluación automática registra eventos del sistema, pero no cubre todas las operaciones.
- **Dashboard:** hay resumen global; falta `comunidadId`, métricas requeridas de comunidades y sensores activos/inactivos, distribución por nivel, series de lecturas y eventos climáticos. La información debe refrescarse por SignalR o actualización periódica.
- **Validación y contratos:** normalizar códigos HTTP, errores y DTOs; los controladores mezclan DTOs con entidades. Añadir validación de campos, unicidad de códigos/usuarios y reglas de fechas/umbrales.

### Frontend

- Crear módulos/rutas y servicios para **comunidades**, **usuarios** y **bitácora**; no aparecen en las rutas ni en la estructura actual de `frontend/src/app/features`.
- Completar la administración de sensores con código, ubicación, fecha de instalación, descripción, filtros y selector de comunidad. Alinear los filtros del servicio con los que realmente aplique el backend.
- Completar reglas con umbral máximo y estado; validar coherencia de límites y nivel/fenómeno antes del envío.
- Actualizar alertas para detalle, filtros requeridos, atención/cierre, responsable y estados, en lugar de asumir únicamente el booleano `activa`.
- Ampliar historial con filtros por fecha, comunidad, fenómeno y nivel, y consumir estadísticas. Corregir el filtro `sensorId` actualmente enviado por Angular pero ignorado por la API.
- Ampliar dashboard con selector de comunidad, métricas agregadas, distribución de niveles, evolución temporal y eventos; conectar las actualizaciones en tiempo real a DTOs estables.
- Aplicar guard a rutas privadas y control visual por rol. El guard presente permite siempre el acceso; el estado de `localStorage` no reemplaza validación del JWT en backend.
- Definir estados de carga, error, vacío y confirmación para las nuevas operaciones administrativas; agregar formularios y validaciones alineadas con los DTOs acordados.
- Alinear documentación/paquetes con la versión decidida de Angular: hoy el código está en Angular 20, no 22+.

### Arquitectura y datos

- Crear entidad y tabla `Comunidades`, relacionar `Sensores.ComunidadId` con una FK y crear/actualizar datos semilla válidos. El esquema SQL actual no tiene tabla de comunidades ni FK para ese campo.
- Añadir migraciones versionadas o definir una sola fuente de verdad para crear/evolucionar esquema. Actualmente hay inicialización SQL propia y configuración EF/seed duplicada, susceptibles a divergir.
- Definir relaciones e índices para consultas frecuentes: comunidad-sensores, sensor-lecturas, sensor-alertas, alerta-regla, alerta-responsable y auditoría por fecha/usuario.
- Separar DTOs de persistencia en todos los endpoints. En particular, no devolver directamente `Usuario`, `Bitacora` o `HistorialEvento`.
- Formalizar la API en OpenAPI como contrato revisado por ambos equipos y acordar las decisiones de compatibilidad indicadas abajo.
- La preparación para microservicios es parcial: hay servicios e interfaces, pero un único API, repositorio central y DbContext. Mantener límites de dominio y evitar que módulos frontend/backend dependan de entidades de persistencia compartidas.

### Docker y Compose (sin VPS)

- La topología local de tres servicios ya está: `db`, `api` y `frontend`, conectados por una red y con volumen persistente de SQL Server. Nginx está dentro del contenedor frontend y enruta `/api` y `/hubs` hacia la API.
- Retirar valores de contraseña débiles/de desarrollo (`desa123$`) como fallback, no versionar secretos y agregar un `.env.example` sin secretos. JWT requiere la misma externalización.
- No publicar SQL Server en todas las ejecuciones por defecto. Para desarrollo, habilitar el puerto del host mediante override/perfil; entre contenedores la API usa la red interna.
- Agregar healthcheck de API y `depends_on` condicionado para frontend; hoy SQL tiene healthcheck, pero API/frontend solo esperan el inicio del contenedor, no que el servicio esté listo.
- Definir de forma explícita inicialización/migración al arrancar y garantizar que sea idempotente. No confiar en que un contenedor SQL listo implique que el esquema esté actualizado.
- Confirmar configuración de WebSocket/SignalR en Nginx y una prueba de extremo a extremo dentro de Compose.
- Agregar instrucciones reproducibles de arranque, variables requeridas, persistencia/restauración del volumen y lectura de logs. Estos puntos son operativos de Docker; no incluyen requisitos de despliegue VPS.

## Contrato API propuesto

Este contrato conserva las rutas españolas ya usadas y amplía sus recursos. Las rutas marcadas **actual** existen en código; **pendiente** requiere implementación. El frontend y backend deben tratar este documento como contrato objetivo y no asumir que todo ya está disponible.

### Convenciones comunes

- Base local desde navegador: `/api`. En Compose, el Nginx del frontend hace proxy de `/api/*` a la API. Hub: `/hubs/monitoreo`.
- JSON `camelCase`; fechas ISO-8601 en UTC (`2026-10-05T14:30:00Z`); IDs enteros; decimales JSON numéricos.
- Valores enumerados en mayúscula: roles `ADMIN`, `OPERADOR`, `CONSULTA`; niveles `VERDE`, `AMARILLO`, `NARANJA`, `ROJO`; estados de alerta `ACTIVA`, `ATENDIDA`, `CERRADA`.
- Todas las rutas excepto login requieren `Authorization: Bearer <token>`. Autorización por operación según la matriz más abajo.
- Colecciones devuelven arreglos JSON. Los filtros son query parameters opcionales. Agregar paginación será una evolución coordinada, no cambiar silenciosamente arreglos por un objeto.
- Errores objetivo: `application/problem+json` con `{ "status": 400, "title": "Validación", "detail": "...", "errors": { "campo": ["... "] } }`. Para compatibilidad, documentar la transición desde el formato `{status,message,errors}` actual.
- Respuestas: `200` lectura/actualización, `201` creación con `Location`, `204` eliminación/logout, `400` validación, `401` sin token/credenciales, `403` rol insuficiente, `404` recurso inexistente, `409` duplicado/conflicto.
- No aceptar ni devolver entidades EF. Todos los recursos de respuesta son DTOs y no exponen contraseñas, hashes ni datos internos.

### Autenticación y permisos

| Método y ruta | Acceso | Estado/uso |
|---|---|---|
| `POST /api/auth/login` | Público | **Actual.** Recibe credenciales, devuelve JWT y usuario resumido. |
| `GET /api/auth/me` | Autenticado | **Actual.** Devuelve identidad/rol del token. |
| `POST /api/auth/logout` | Autenticado | **Pendiente.** Registra logout; al ser JWT stateless, el cliente también elimina token. Revocación inmediata requiere denylist/refresh-token, fuera del comportamiento actual. |

Login request:

```json
{ "username": "operador", "password": "<contraseña>" }
```

Login response (`200`):

```json
{
  "token": "<jwt>",
  "tokenType": "Bearer",
  "expiresAt": "2026-10-05T22:30:00Z",
  "user": { "id": 2, "username": "operador", "nombre": "Operador", "rol": "OPERADOR" }
}
```

La propiedad actual `tokenType` es una adición recomendada; `token`, `expiresAt` y `user` ya existen. Token objetivo con expiración configurable.

| Rol | Lectura | Escritura |
|---|---|---|
| `ADMIN` | Todos los módulos | Todos los módulos, usuarios, roles, reglas y auditoría. |
| `OPERADOR` | Dashboard, comunidades, sensores, lecturas, alertas e historial | Operación de sensores/lecturas y atención/cierre de alertas. Sin administración de usuarios, roles ni reglas. |
| `CONSULTA` | Dashboard, comunidades, sensores, lecturas, alertas e historial | Ninguna. |

### Comunidades (pendiente)

| Método y ruta | Permiso | Uso |
|---|---|---|
| `GET /api/comunidades?buscar=&activo=&municipio=&departamento=` | Autenticado | Lista y filtros. |
| `GET /api/comunidades/{id}` | Autenticado | Detalle. |
| `POST /api/comunidades` | ADMIN | Crear. |
| `PUT /api/comunidades/{id}` | ADMIN | Editar datos. |
| `PATCH /api/comunidades/{id}/estado` | ADMIN | Activar/desactivar; body `{ "activo": false }`. |

Comunidad DTO: `id`, `nombre`, `municipio`, `departamento`, `pais`, `latitud`, `longitud`, `descripcion`, `activo`, `sensoresActivos`, `sensoresTotales`.

### Sensores

| Método y ruta | Permiso | Uso |
|---|---|---|
| `GET /api/sensores?comunidadId=&tipo=&activo=&codigo=&buscar=` | Autenticado | **Actual sin filtros.** Listado. |
| `GET /api/sensores/{id}` | Autenticado | **Actual.** Detalle. |
| `POST /api/sensores` | ADMIN/OPERADOR | **Actual, DTO incompleto.** Crear. |
| `PUT /api/sensores/{id}` | ADMIN/OPERADOR | **Actual, DTO incompleto.** Editar. |
| `PATCH /api/sensores/{id}/estado` | ADMIN/OPERADOR | **Actual.** Body `{ "activo": false }`. |
| `DELETE /api/sensores/{id}` | ADMIN | **Actual.** Preferir desactivación si existen lecturas asociadas. |

Sensor request: `nombre`, `codigo`, `tipo`, `comunidadId`, `latitud`, `longitud`, `unidad`, `activo`, `fechaInstalacion`, `descripcion`. Tipos iniciales: `TEMPERATURA`, `HUMEDAD`, `VIENTO`, `LLUVIA`, `NIVEL_RIO`, `RESERVORIO`, `HUMO`, `OTRO`.

Sensor response: request fields más `id`, `valorActual`, `ultimaLectura`. No permitir lecturas ni evaluación automática para sensores inactivos.

### Lecturas

| Método y ruta | Permiso | Uso |
|---|---|---|
| `GET /api/lecturas?sensorId=&comunidadId=&desde=&hasta=` | Autenticado | **Actual con sensor/fechas.** Listado filtrado; agregar comunidad. |
| `POST /api/lecturas` | ADMIN/OPERADOR o credencial de dispositivo | **Actual.** Registrar lectura y evaluar reglas activas. |

Lectura request: `{ "sensorId": 1, "valor": 27.5 }`. La API asigna fecha UTC y deriva unidad/estado del sensor; no confiar en un estado enviado por cliente.

Lectura response: `id`, `sensorId`, `comunidadId`, `fechaHora`, `valor`, `unidad`, `estadoSensor`.

### Reglas de alerta

| Método y ruta | Permiso | Uso |
|---|---|---|
| `GET /api/configuracionalertas?tipoSensor=` | Actual: ADMIN; objetivo: autenticado | **Actual; ruta declarada como `/api/ConfiguracionAlertas` (el enrutamiento no distingue mayúsculas).** Lista. |
| `GET /api/configuracionalertas/{id}` | Actual: ADMIN; objetivo: autenticado | **Actual.** Detalle. |
| `POST /api/configuracionalertas` | ADMIN | **Actual.** Crear. |
| `PUT /api/configuracionalertas/{id}` | ADMIN | **Actual.** Editar. |
| `PATCH /api/configuracionalertas/{id}/estado` | ADMIN | **Pendiente recomendado.** Activar/desactivar sin borrar. |
| `DELETE /api/configuracionalertas/{id}` | ADMIN | **Actual.** El borrado debe respetar la trazabilidad. |

Regla DTO: `id`, `nombre`, `tipoSensor`, `valorMinimo`, `valorMaximo`, `nivel`, `fenomeno`, `mensaje`, `activo`. Un límite puede ser `null`; la lectura incumple si cae fuera del intervalo definido. Validar que al menos un límite exista y que mínimo no supere máximo. Una alerta almacenará `configuracionAlertaId`.

### Alertas

| Método y ruta | Permiso | Uso |
|---|---|---|
| `GET /api/alertas?desde=&hasta=&comunidadId=&sensorId=&fenomeno=&nivel=&estado=` | Autenticado | **Actual con filtro booleano `activas`.** Reemplazar/compatibilizar filtro. |
| `GET /api/alertas/activas` | Autenticado | **Actual.** Mantener como alias de estado `ACTIVA`. |
| `GET /api/alertas/{id}` | Autenticado | **Pendiente.** Detalle. |
| `PATCH /api/alertas/{id}/estado` | ADMIN/OPERADOR | **Pendiente.** Body `{ "estado": "ATENDIDA" }` o `CERRADA`; responsable se toma del JWT. |
| `POST /api/alertas/{id}/cerrar` | ADMIN/OPERADOR | **Actual.** Compatibilidad temporal; migrar al PATCH de estado. |

Alerta DTO: `id`, `fechaHora`, `comunidadId`, `comunidadNombre`, `sensorId`, `sensorNombre`, `configuracionAlertaId`, `fenomeno`, `nivel`, `valorDetectado`, `valorMinimo`, `valorMaximo`, `mensaje`, `estado`, `atendidaPorId`, `atendidaPorNombre`, `fechaAtencion`, `cerradaPorId`, `cerradaPorNombre`, `fechaCierre`.

### Historial, bitácora y dashboard

| Método y ruta | Permiso | Uso |
|---|---|---|
| `GET /api/historial?desde=&hasta=&comunidadId=&sensorId=&fenomeno=&nivel=` | Autenticado | **Actual sin filtros.** Eventos históricos. |
| `GET /api/historial/estadisticas?desde=&hasta=&comunidadId=` | Autenticado | **Pendiente.** Conteos por fenómeno/nivel y periodo. |
| `GET /api/bitacora?desde=&hasta=&usuarioId=&accion=&entidad=` | ADMIN | **Actual sin filtros y permiso demasiado amplio.** Consultar auditoría. |
| `GET /api/dashboard?comunidadId=&desde=&hasta=` | Autenticado | **Actual sin filtros.** Resumen filtrable. |
| `GET /api/dashboard/series?comunidadId=&desde=&hasta=&tipoSensor=` | Autenticado | **Pendiente.** Puntos de lecturas para gráficas. |

Historial DTO: `id`, `fechaHora`, `comunidadId`, `sensorId`, `sensorNombre`, `alertaId`, `fenomeno`, `nivel`, `valor`, `mensaje`, `estado`, `responsableId`, `responsableNombre`.

Bitácora DTO: `id`, `usuarioId`, `usuarioNombre`, `accion`, `entidad`, `entidadId`, `descripcion`, `fechaHora`. Actor y fecha los establece el backend.

El dashboard debe conservar los campos actuales (`temperatura`, `humedad`, `viento`, `lluvia`, `nivelRio`, `nivelGeneral`, `alertasActivas`, `sensoresActivos`, `sensoresTotales`) y agregar `comunidades`, `sensoresInactivos`, `alertasPorNivel`, `eventosRecientes`. Las series devuelven `{ "fechaHora": "...Z", "valor": 1.2 }`.

### Usuarios

| Método y ruta | Permiso | Uso |
|---|---|---|
| `GET /api/usuarios?buscar=&rol=&activo=` | ADMIN | **Actual sin filtros; respuesta insegura.** Listar usando DTO seguro. |
| `GET /api/usuarios/{id}` | ADMIN | **Pendiente.** Detalle seguro. |
| `POST /api/usuarios` | ADMIN | **Pendiente.** Crear; el body recibe contraseña sin procesar solo sobre transporte protegido, backend guarda hash. |
| `PUT /api/usuarios/{id}` | ADMIN | **Pendiente.** Editar datos/rol; contraseña solo si se envía explícitamente. |
| `PATCH /api/usuarios/{id}/estado` | ADMIN | **Pendiente.** Body `{ "activo": false }`. |

Usuario response: `id`, `username`, `nombre`, `rol`, `activo`, `fechaCreacion`, `ultimoAcceso`. Nunca incluir `password` o `passwordHash`.

### SignalR

Hub: `/hubs/monitoreo`, autenticado con el mismo JWT. Eventos acordados: `lecturaActualizada` con Lectura DTO y `alertaGenerada` con Alerta DTO. Ambos eventos ya se emiten; `lecturaActualizada` actualmente envía solo `sensorId`, `valor` y `fechaHora`, mientras que `alertaGenerada` envía el modelo de persistencia. Alinear ambos payloads con DTOs estables y emitir después de persistir correctamente.

## Acuerdos para empezar en paralelo

1. Aceptar enums, nombres JSON, filtros, roles y estados de este contrato antes de implementar nuevas pantallas.
2. Backend publica/actualiza Swagger con las rutas y DTOs; frontend desarrolla contra estos DTOs y no contra entidades SQL.
3. Priorizar hash/DTO seguro/roles y el modelo de comunidad antes de exponer administración de usuarios o comunidades.
4. Implementar primero el contrato mínimo de comunidades, sensores, lecturas, reglas y alertas; luego completar auditoría, estadísticas y visualizaciones.
5. Mantener compatibilidad temporal para `alertas/activas`, `alertas/{id}/cerrar` y los arreglos JSON actuales; cualquier cambio de respuesta se coordina y versiona.
