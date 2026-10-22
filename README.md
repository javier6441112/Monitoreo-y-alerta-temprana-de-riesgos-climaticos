# Monitoreo y alerta temprana de riesgos climáticos

La arquitectura activa usa un Gateway YARP y seis microservicios: Auth (NestJS), Community y Sensor (.NET 10), Alert (Java/Spring Boot), Report y Audit (Python/FastAPI). La persistencia se distribuye entre PostgreSQL, SQL Server y MongoDB. Angular accede a las APIs mediante Nginx y Gateway.

## Ejecutar

Requiere Docker con contenedores Linux y Docker Compose.

En una instalación nueva, generar primero las claves locales:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/init-env.ps1
docker compose up -d --build --wait --wait-timeout 240
```

Si `.env` ya existe, conservarlo y ejecutar solamente Docker Compose. En GNU/Linux, configurar `.env` siguiendo `.env.example` con claves y contraseñas reales.

- Aplicación: http://localhost:4200
- Reportes: http://localhost:4200/reportes
- Gateway: http://localhost:5000

Los usuarios importados conservan sus contraseñas anteriores. ADMIN_PASSWORD solo inicializa bases vacías. Hay que iniciar sesión nuevamente después de la migración.

## Documentación

- [Microservicios: contratos, operación, seguridad, pruebas y migración](docs/fase-3/MICROSERVICIOS.md).
- [Lista de tareas de fase 3](TAREAS_FASE_3.md).
- [Diseño inicial de la reingeniería](docs/fase-3/ARQUITECTURA.md).

La carpeta Backend contiene la versión monolítica anterior. El despliegue activo no la utiliza. docker-compose.legacy.yml y nginx.legacy.conf permiten consultar esa configuración, utilizando su propio archivo de entorno.

El VPS, HTTPS y la actualización de Angular 20 a 22+ siguen pendientes. No se deben subir archivos .env ni exportaciones privadas de la base de datos.
