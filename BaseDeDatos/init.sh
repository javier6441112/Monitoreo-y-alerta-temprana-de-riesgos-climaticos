#!/bin/bash
set -e

/opt/mssql/bin/sqlservr &
sqlserver_pid=$!
sqlcmd_path=/opt/mssql-tools18/bin/sqlcmd

echo "Esperando a que SQL Server acepte conexiones..."
until "$sqlcmd_path" -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" > /dev/null 2>&1; do
  sleep 2
done

echo "Creando la base de datos y aplicando el esquema..."
"$sqlcmd_path" -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -v DatabaseName="$DB_NAME" -i /docker-entrypoint-initdb.d/schema.sql

echo "Base de datos lista."
wait "$sqlserver_pid"
