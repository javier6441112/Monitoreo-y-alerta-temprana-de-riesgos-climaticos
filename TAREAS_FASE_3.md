# Lista de tareas — Fase 3

Plan basado en `phase_3.md`, `rubricaMD.txt` y la revisión estática de la rama `desarrollo` en el commit `1854059`.

Las casillas representan trabajo pendiente o verificaciones por completar. La existencia de código no acredita su funcionamiento en ejecución.

### Avance del 21 de octubre de 2026

Se implementaron y desplegaron localmente los seis microservicios independientes y el Gateway YARP. Docker Compose ya no dirige solicitudes al monolito. Se trasladaron y verificaron los datos existentes: 2 usuarios, 1 comunidad, 5 sensores y 6 reglas, conservando IDs y hashes de contraseña. El volumen original y los volúmenes de pruebas se conservaron como respaldo.

- [Arquitectura activa, contratos, operación y traslado ejecutado](docs/fase-3/MICROSERVICIOS.md).
- [Diseño y primer incremento histórico](docs/fase-3/ARQUITECTURA.md).
- [Inventario de contratos, flujos y pendientes](docs/fase-3/CONTRATOS_ACTUALES.md).
- [Pruebas y comandos de verificación](Tests/Regression/README.md).

Verificado: compilación Docker de aplicaciones y frontend; once grupos de integración real; JWT y permisos; WebSocket autenticado; ocho PDF e historial; persistencia tras reinicio; fallo temporal de Alert; pruebas e importación real de datos; ocho PDF adicionales desde los datos migrados. No se acreditan VPS/HTTPS, pruebas de carga, actualización Angular 22+ ni defensa individual.

La base de configuración climática migrada contiene reglas de inundación y tormenta; aún falta completar y demostrar sequía, helada e incendio forestal. La auditoría aplica entrega por HTTP con registro de fallos; una outbox durable de auditoría y la coordinación de simulación/SignalR entre réplicas siguen pendientes.

## 1. Diseño de la reingeniería

- [x] Inventariar endpoints, modelos, reglas y flujos actuales para conservar su comportamiento.
- [ ] Identificar código activo, duplicado y sin uso en backend y frontend.
- [x] Definir límites de Auth, Community, Sensor, Alert, Report y Audit.
- [x] Asignar la propiedad de cada entidad y dato a un único servicio.
- [x] Dibujar arquitectura objetivo y dependencias entre servicios.
- [x] Definir contratos de API: rutas, DTO, filtros, paginación, fechas y errores.
- [x] Definir contratos de JWT, roles, permisos y autenticación entre servicios.
- [x] Definir cómo se consultan datos relacionados sin acceder a bases ajenas.
- [x] Planificar migración de datos, orden de extracción y reversión ante fallos.
- [x] Registrar decisiones técnicas, alternativas, costos y riesgos.

**Criterio de cierre:** arquitectura, propiedad de datos y contratos documentados antes de extraer módulos.

## 2. Base de refactorización

- [ ] Registrar una línea base de funcionamiento de login, comunidades, sensores, lecturas, alertas y dashboard.
- [x] Separar responsabilidades del repositorio compartido por dominio.
- [ ] Retirar código duplicado o vacío una vez comprobado que no se usa.
- [ ] Unificar manejo de errores, validaciones y configuración.
- [x] Definir estructura de carpetas y proyectos para servicios independientes.
- [x] Evitar que archivos generados de compilación formen parte del control de versiones.
- [x] Incorporar pruebas de regresión para los flujos críticos afectados por la extracción.

## 3. API Gateway — 7 puntos

- [x] Crear proyecto ASP.NET Core 10 con YARP.
- [x] Configurar rutas para Auth, Community, Sensor, Alert, Report y Audit.
- [x] Mantener o adaptar explícitamente los contratos consumidos por Angular.
- [x] Implementar validación inicial del JWT.
- [x] Configurar CORS según los orígenes permitidos.
- [x] Implementar logging, correlación de solicitudes y errores consistentes.
- [x] Configurar límites de solicitudes donde corresponda.
- [x] Adaptar el proxy de SignalR y comprobar conexiones autenticadas.
- [x] Dirigir las peticiones del frontend al Gateway.
- [x] Comprobar que la infraestructura interna no queda expuesta innecesariamente.

## 4. Auth Service y seguridad — 7 puntos

- [x] Crear Auth Service con Node.js, NestJS, TypeScript y PostgreSQL.
- [x] Migrar usuarios conservando compatibilidad con los hashes existentes o definir una transición segura.
- [x] Migrar login, consulta de identidad, logout y revocación.
- [x] Implementar administración de roles y permisos.
- [x] Definir emisión y validación de JWT: firma, issuer, audience y expiración.
- [x] Definir comportamiento de revocación y cambios de permisos entre servicios.
- [x] Validar autorización en backend para cada operación protegida.
- [x] Alinear la autorización de bitácora con su política de acceso.
- [x] Proteger el hub de monitoreo y verificar el flujo del token.
- [x] Preparar asociación de identidades externas para OAuth 2.0/OIDC en fase 4.
- [x] Externalizar claves y credenciales; retirar valores predeterminados inseguros de producción.

## 5. Servicios del dominio — arquitectura: 10 puntos

### Community Service

- [x] Crear servicio independiente en .NET 10 y PostgreSQL.
- [x] Migrar comunidades, datos geográficos y estado.
- [x] Sustituir relaciones directas con sensores por asociación lógica mediante identificadores y APIs.
- [x] Publicar consultas necesarias para dashboard y reportes.
- [x] Migrar y verificar los datos existentes.

### Sensor Service

- [x] Extraer sensores, tipos, lecturas, estado e historial a un servicio .NET 10 con SQL Server.
- [x] Conservar operaciones y filtros actualmente utilizados por Angular.
- [x] Implementar o verificar simulación de lecturas.
- [x] Definir estados activo, inactivo y sin comunicación, con criterio de última lectura.
- [x] Definir integración de nuevas lecturas con Alert Service.
- [x] Publicar consultas paginadas para reportería y estadísticas.
- [x] Verificar el comportamiento real del reinicio de monitoreo; actualmente solo registra una acción.

### Alert Service

- [x] Crear servicio Java con Spring Boot y PostgreSQL.
- [x] Migrar reglas, umbrales, evaluación, estados e historial de eventos.
- [ ] Cubrir inundación, sequía, tormenta, helada e incendio forestal.
- [x] Verificar niveles Verde, Amarillo, Naranja y Rojo.
- [x] Conservar valor y umbral aplicados al momento de cada alerta.
- [x] Definir comportamiento ante lecturas repetidas, fallos y reintentos.
- [x] Publicar APIs de alertas, eventos y agregaciones necesarias.

### Audit Service

- [x] Crear servicio Python con FastAPI y MongoDB.
- [x] Migrar la bitácora y definir el contrato de eventos de auditoría.
- [x] Registrar usuario, acción, fecha, servicio y contexto útil sin almacenar secretos.
- [x] Integrar recepción de auditoría desde los demás servicios mediante APIs.
- [x] Restringir consultas según roles y permisos.
- [x] Definir el manejo de fallos del servicio de auditoría.

## 6. Persistencia e integración — 8 puntos

- [x] Configurar PostgreSQL para Auth, Community y Alert con propiedad de datos separada.
- [x] Mantener SQL Server para Sensor.
- [x] Configurar MongoDB para Report y Audit con datos y permisos separados.
- [x] Crear scripts o migraciones reproducibles para cada servicio.
- [x] Eliminar dependencias de tablas o claves foráneas entre dominios extraídos.
- [x] Confirmar que ningún servicio consulta directamente la base de otro.
- [x] Implementar timeouts, errores y reintentos seguros en llamadas entre servicios.
- [x] Verificar integración real de los lenguajes y gestores requeridos.
- [ ] Preparar respaldo y restauración de datos persistentes.

**Nota:** el mínimo es tres lenguajes backend; la distribución de servicios especificada utiliza cuatro: C#, TypeScript, Java y Python.

## 7. Report Service — 12 puntos

- [x] Crear servicio independiente con Python, FastAPI y MongoDB.
- [x] Obtener datos exclusivamente mediante APIs de los servicios propietarios.
- [x] Generar HTML con Jinja2 y PDF con WeasyPrint en backend.
- [x] Crear plantillas con logo, encabezado, nombre, fecha, usuario, tablas, numeración y pie.
- [x] Persistir identificador, tipo, usuario, fecha, parámetros, estado y referencia al archivo.
- [x] Registrar fecha de descarga del reporte.
- [x] Definir almacenamiento persistente de archivos compatible con múltiples réplicas.
- [x] Validar firma, issuer, audience, expiración, roles y permisos.
- [x] Autorizar generación y consultas; restringir descarga a administradores autorizados.
- [x] Implementar validación de filtros y rangos de fechas.
- [x] Resolver grandes volúmenes con límites, lotes o procesamiento asíncrono.
- [x] Manejar errores de obtención de datos, generación y descarga.

### Reportes funcionales

- [x] **RF-REP-01:** comunidades: nombre, municipio, departamento, país, coordenadas, estado y cantidad de sensores.
- [x] **RF-REP-02:** sensores: código, nombre, tipo, comunidad, ubicación, unidad, estado y fecha de instalación.
- [x] **RF-REP-03:** lecturas: sensor, comunidad, fecha, hora, valor, unidad y estado; filtros por sensor, comunidad, fechas y tipo.
- [x] **RF-REP-04:** alertas: fecha, hora, comunidad, sensor, fenómeno, nivel, valor, umbral, mensaje y estado.
- [x] **RF-REP-05:** historial de eventos para los cinco fenómenos requeridos.
- [x] **RF-REP-06:** estado de sensores: activos, inactivos, sin comunicación, última lectura y comunidad.
- [x] **RF-REP-07:** estadísticas: temperatura promedio/mínima/máxima, humedad, viento, lluvia acumulada, nivel de río y alertas.
- [x] **RF-REP-08:** ejecutivo: situación climática global, comunidades, sensores, alertas, eventos e indicadores.
- [x] **RF-REP-09:** historial de reportes con todos sus metadatos.
- [x] **RF-REP-10:** descarga exclusiva para administradores autorizados.

## 8. Frontend y dashboard — 6 puntos

- [ ] Actualizar Angular de la versión 20 declarada a 22+ conforme al requisito y verificar compatibilidad.
- [x] Crear ruta, componente, modelos y servicio de reportería.
- [x] Agregar selección del tipo de reporte y filtros correspondientes.
- [x] Mostrar validaciones y estados de generación, éxito y error.
- [x] Descargar el PDF generado por backend.
- [x] Mostrar historial, parámetros, estado y acciones autorizadas.
- [x] Aplicar permisos en la interfaz y comprobar su respaldo en backend.
- [x] Ampliar indicadores de comunidades, sensores, alertas y eventos.
- [ ] Incorporar distribuciones por nivel y fenómeno y estadísticas climáticas.
- [x] Adaptar contratos del dashboard y sus series a la arquitectura nueva.

## 9. Despliegue e infraestructura — 10 puntos

- [x] Crear Dockerfile independiente por servicio.
- [x] Ampliar Docker Compose para Gateway, seis servicios, frontend y gestores de bases de datos.
- [x] Corregir la diferencia entre `./frontend` y la carpeta `Frontend` para despliegues Linux.
- [x] Configurar Nginx delante del Gateway y frontend.
- [ ] Configurar dominio, certificados HTTPS y renovación.
- [x] Mantener servicios y bases internas en redes privadas cuando corresponda.
- [x] Configurar variables de entorno y proporcionar ejemplos sin secretos.
- [x] Añadir health checks por servicio y comprobaciones de dependencias.
- [x] Configurar volúmenes para bases de datos y archivos de reportes.
- [x] Preparar servicios stateless, apagado ordenado y configuración compatible con futuros Secrets y ConfigMaps.
- [ ] Desplegar en VPS y verificar los flujos principales por HTTPS.
- [ ] Documentar instalación, actualización, restauración y reversión.

## 10. Verificación y evidencias

- [x] Probar login, logout, expiración, revocación y JWT inválidos.
- [x] Probar acceso sin autenticación y permisos insuficientes en Gateway y servicios.
- [ ] Probar CRUD y flujos críticos tras migrar cada dominio. Los flujos críticos tienen integración real; queda ampliar la cobertura de todas las variantes de edición y eliminación.
- [x] Probar filtros, contenido y descarga de cada reporte.
- [x] Comprobar metadatos y registro de descargas en MongoDB.
- [ ] Probar fallos entre servicios y generación con volúmenes representativos.
- [x] Verificar persistencia después de reiniciar contenedores.
- [x] Preparar diagrama final de arquitectura.
- [x] Reunir evidencias de APIs, bases, seguridad y generación de PDF.
- [ ] Capturar dashboard, historial de reportes y despliegue HTTPS.

## 11. Defensa individual — 40 puntos

- [ ] Explicar Angular → Gateway → servicios → bases y dependencias (**8 puntos**).
- [ ] Presentar ejemplos de cohesión, acoplamiento, duplicación y refactorización (**7 puntos**).
- [ ] Explicar JWT, roles, permisos y límites de confianza (**7 puntos**).
- [ ] Justificar gestores, propiedad de datos e integración y sus fallos (**6 puntos**).
- [ ] Documentar debilidades reales y comparar mejoras por costo, beneficio y riesgo (**7 puntos**).
- [ ] Preparar demostración y respuestas con evidencias del proyecto (**5 puntos**).

## Orden sugerido

1. Diseño, contratos y línea base: etapas 1–2.
2. Gateway y Auth: etapas 3–4.
3. Extracción de dominios y persistencia: etapas 5–6.
4. Report Service y reportes: etapa 7.
5. Integración Angular y dashboard: etapa 8.
6. Cierre de despliegue, pruebas y defensa: etapas 9–11.

La configuración de contenedores, seguridad y pruebas debe acompañar cada extracción. OAuth/OIDC externo y la orquestación efectiva con Kubernetes/K3s corresponden a fase 4; esta fase prepara el diseño para incorporarlos.
