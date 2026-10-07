#!/bin/bash
set -e

export SQLCMDPASSWORD="${MSSQL_SA_PASSWORD}"
SQLSERVER_HOST="${SQLSERVER_HOST:-localhost}"

until /opt/mssql-tools18/bin/sqlcmd -S "${SQLSERVER_HOST}" -U sa -P "${MSSQL_SA_PASSWORD}" -d master -C -Q "SELECT 1" >/dev/null 2>&1; do
  echo "Esperando SQL Server..."
  sleep 5
done

/opt/mssql-tools18/bin/sqlcmd -S "${SQLSERVER_HOST}" -U sa -P "${MSSQL_SA_PASSWORD}" -d master -C -Q "IF DB_ID(N'ClimateRiskDb') IS NULL CREATE DATABASE [ClimateRiskDb];"

/opt/mssql-tools18/bin/sqlcmd -S "${SQLSERVER_HOST}" -U sa -P "${MSSQL_SA_PASSWORD}" -d ClimateRiskDb -C -i /docker-entrypoint-initdb.d/init-db.sql
