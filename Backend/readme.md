# Backend y contenedores

Base inicial del backend para el sistema de monitoreo y alerta temprana de riesgos climáticos.

## Servicio

- `api`: API mínima ASP.NET Core sobre .NET 10, publicada en `http://localhost:8080`.

SQL Server se administra desde [`BaseDeDatos`](../BaseDeDatos), en la red Docker compartida `climate-risk-network`.

## Arranque local

1. Levantar primero la base de datos desde `BaseDeDatos`:

```bash
cd ../BaseDeDatos
cp .env.example .env
docker compose up -d --build
```

2. Iniciar la API:

```bash
cd ../Backend
cp .env.example .env
docker compose up -d --build
```

3. Comprobar la API:

```bash
curl http://localhost:8080/health
```

La respuesta esperada contiene `"status":"ok"`. Para revisar el estado de los contenedores:

```bash
docker compose ps
docker compose logs -f api
```

Para detener los contenedores sin eliminar los datos:

```bash
docker compose down
```

La base de datos se inicializa automáticamente con sus tablas al crear el contenedor. Para eliminar también el volumen de SQL Server, únicamente cuando sea necesario reiniciar la base desde cero:

```bash
cd ../BaseDeDatos
docker compose down -v
```

## Conexión a SQL Server

Desde otro contenedor conectado a `climate-risk-network`, el servidor es `climate-risk-db,1433`. La cadena configurada para .NET es:

```text
Server=climate-risk-db,1433;Database=ClimateRiskDb;User Id=sa;Password=<MSSQL_SA_PASSWORD>;TrustServerCertificate=True;Encrypt=False
```

Desde el equipo anfitrión se puede usar `localhost,1433`.

## Despliegue en VPS

Instalar Docker Engine y el plugin Docker Compose en el servidor GNU/Linux, copiar el proyecto y ejecutar primero la base de datos:

```bash
cd BaseDeDatos
cp .env.example .env
nano .env
docker compose up -d --build
cd ../Backend
docker compose up -d --build
```

En producción se recomienda publicar la API detrás de un proxy HTTPS y no exponer el puerto `1433` a Internet. El valor de `MSSQL_SA_PASSWORD` nunca debe guardarse en el repositorio.
