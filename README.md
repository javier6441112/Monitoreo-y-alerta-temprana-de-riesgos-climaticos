# Monitoreo y Alerta Temprana de Riesgos Climáticos

Plataforma web para monitoreo, consulta y alerta de riesgos climáticos. La aplicación se publica en [desawebproyectoclimatico.dpdns.org](https://desawebproyectoclimatico.dpdns.org/).

## Arquitectura

La solución usa un Gateway YARP y seis microservicios:

- **Auth**: NestJS; autenticación, roles, permisos y proveedores OAuth.
- **Community** y **Sensor**: .NET 10.
- **Alert**: Java / Spring Boot.
- **Report** y **Audit**: Python / FastAPI.
- **Frontend**: Angular servido por Nginx.

La persistencia combina PostgreSQL, SQL Server y MongoDB. El acceso externo entra por Traefik/Nginx hacia el Gateway, que enruta las solicitudes a los servicios internos.

## Ejecutar localmente con Docker Compose

Requiere Docker con contenedores Linux y Docker Compose.

En una instalación nueva, generar primero las claves locales:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/init-env.ps1
docker compose up -d --build --wait --wait-timeout 240
```

Si `.env` ya existe, conservarlo y ejecutar solamente Docker Compose. En GNU/Linux, crear `.env` basándose en `.env.example`, con claves y contraseñas privadas.

- Aplicación: <http://localhost:4200>
- Gateway: <http://localhost:5000>
- Reportes: <http://localhost:4200/reportes>

`ADMIN_PASSWORD` crea al administrador solo si el nombre de usuario aún no existe; no reemplaza contraseñas ya creadas.

## Despliegue en VPS con K3s

El entorno de producción se ejecuta en un clúster K3s de un solo nodo, con Traefik como Ingress. Cloudflare puede mantenerse en modo **Full**; debe dirigir el registro DNS al servidor y los puertos TCP 80/443 deben estar disponibles.

El procedimiento completo, incluidos instalación de K3s, destrucción opcional de datos Docker Compose, creación de Secrets, importación de imágenes y diagnóstico, está en [docs/K3S_VPS_DEPLOYMENT.md](docs/K3S_VPS_DEPLOYMENT.md).

Los manifiestos Kubernetes viven en `infra/k8s/`. Los datos privados se cargan desde `.env.k8s`, archivo que no debe versionarse ni compartirse.

## Inicio de sesión con Google y GitHub

Además del acceso con usuario y contraseña, Auth admite OAuth 2.0 mediante Google y GitHub. Un usuario que inicia sesión por primera vez usando un proveedor externo se crea automáticamente con el rol **`CONSULTA`**. Si ya había iniciado sesión antes con ese mismo proveedor, conserva el rol que tenga asignado.

Para habilitar los botones, definir en `.env` o `.env.k8s`:

```dotenv
PUBLIC_URL=https://desawebproyectoclimatico.dpdns.org
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=
OAUTH_GITHUB_CLIENT_ID=
OAUTH_GITHUB_CLIENT_SECRET=
```

Las URL de redirección deben coincidir de forma exacta con la configuración de cada proveedor:

```text
https://desawebproyectoclimatico.dpdns.org/api/auth/oauth/google/callback
https://desawebproyectoclimatico.dpdns.org/api/auth/oauth/github/callback
```

No se deben publicar valores de `.env`, `.env.k8s`, Client Secrets ni respaldos de bases de datos. Si un secreto se expone, debe rotarse en el proveedor correspondiente y actualizarse en Kubernetes.

## Cambios implementados recientemente

- Despliegue de la arquitectura de microservicios en K3s para la VPS.
- Configuración de Traefik, Ingress, ConfigMap, Secret, PVC y Deployments/StatefulSets.
- Inicio de sesión OAuth 2.0 con Google y GitHub.
- Creación automática de usuarios OAuth nuevos con rol `CONSULTA`.
- Botones de acceso externo con iconos de Google y GitHub.

## Documentación adicional

- [Guía de despliegue K3s](docs/K3S_VPS_DEPLOYMENT.md)
- [Documentación técnica](<DOCUMENTACION_TECNICA .md>)
- [Microservicios: contratos, operación, seguridad, pruebas y migración](docs/fase-3/MICROSERVICIOS.md)
- [Semilla de datos de demostración](docs/fase-3/SEMILLA_DEMO.md)
- [Arquitectura inicial](docs/fase-3/ARQUITECTURA.md)
- [Tareas de fase 3](TAREAS_FASE_3.md)
