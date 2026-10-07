# Backend y contenedores

Base inicial del backend para el sistema de monitoreo y alerta temprana de riesgos climáticos.

## Servicio

- `api`: API ASP.NET Core sobre .NET 10, publicada en `http://localhost:5001` desde este Compose.
- `db-init`: aplica el script inicial contra el servicio `db` del Compose general.

Este Compose no crea otro SQL Server. Requiere que la base del Compose general esté activa en la red externa `climate-risk-network`.

## Arranque local

1. Desde la raíz del repositorio, levantar el Compose general:

```bash
docker compose up -d --build
```

2. Para iniciar también la API definida en este Compose, desde la raíz:

```bash
docker compose -f Backend/docker-compose.yml up -d --build
```

3. Comprobar la API:

```bash
curl http://localhost:5001/health
```

La respuesta esperada contiene `"status":"ok"`. Para revisar el estado de esta API:

```bash
docker compose -f Backend/docker-compose.yml ps
docker compose -f Backend/docker-compose.yml logs -f api
```

Para detener los contenedores sin eliminar los datos:

```bash
docker compose -f Backend/docker-compose.yml down
```

Este comando no detiene ni elimina la base del Compose general. Para detener el stack completo, ejecuta `docker compose down` desde la raíz. La base persiste en un volumen; no lo elimines si necesitas conservar los datos.

`db-init` usa `Backend/db/init-db.sql`. Su esquema no coincide completamente con `BaseDeDatos/schema.sql`; alinear o migrar esas tablas requiere un cambio de esquema separado.

Para eliminar el volumen de SQL Server únicamente cuando sea necesario reiniciar la base desde cero:

```bash
docker compose down -v
```

## Conexión a SQL Server

Desde los contenedores conectados a `climate-risk-network`, el servidor del Compose general es `db,1433`. La cadena configurada para .NET es:

```text
Server=db,1433;Database=ClimateRiskDb;User Id=sa;Password=<MSSQL_SA_PASSWORD>;TrustServerCertificate=True;Encrypt=False
```

Desde el equipo anfitrión se puede usar `localhost,1433`.

## Despliegue en VPS

Instalar Docker Engine y el plugin Docker Compose en el servidor GNU/Linux, copiar el proyecto y ejecutar el Compose general desde la raíz:

```bash
docker compose up -d --build
```

En producción se recomienda publicar la API detrás de un proxy HTTPS y no exponer el puerto `1433` a Internet. El valor de `MSSQL_SA_PASSWORD` nunca debe guardarse en el repositorio.
