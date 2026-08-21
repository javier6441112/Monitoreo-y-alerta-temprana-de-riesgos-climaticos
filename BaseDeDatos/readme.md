# Base de datos

Contenedor SQL Server 2022 Developer para el sistema de monitoreo y alerta temprana.

## Estructura

- `docker-compose.yml`: ejecuta SQL Server y crea la red compartida `climate-risk-network`.
- `Dockerfile`: construye la imagen con el inicializador del esquema.
- `init.sh`: espera a SQL Server, crea la base configurada y aplica `schema.sql`.
- `schema.sql`: crea las tablas de usuarios, sensores, lecturas, alertas, historial de eventos y bitácora.

El esquema es idempotente: las tablas existentes no se eliminan al reiniciar el contenedor.

## Arranque

```bash
cp .env.example .env
# Editar .env y establecer una contraseña fuerte para MSSQL_SA_PASSWORD
docker compose up -d --build
docker compose ps
```

La base queda disponible desde el equipo anfitrión en `localhost,1433`. Los contenedores del backend deben conectarse a `climate-risk-db,1433` usando la red `climate-risk-network`.

Para detener el contenedor sin eliminar datos:

```bash
docker compose down
```

Para reiniciar completamente la base y borrar el volumen:

```bash
docker compose down -v
```

No expongas el puerto `1433` a Internet en producción; limita el acceso al backend y usa una contraseña secreta fuera del repositorio.
