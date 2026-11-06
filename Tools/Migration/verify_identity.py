"""Post-import identity check; probe insert is rolled back."""
import pytds
from migrate import required

connection=pytds.connect(required("SENSOR_SQL_HOST"),database="WeatherRiskSensors",user="sa",password=required("MSSQL_SA_PASSWORD"))
try:
    cursor=connection.cursor()
    cursor.execute("SELECT COUNT(*) FROM readings")
    empty=cursor.fetchone()[0]==0
    if empty:
        cursor.execute("DBCC CHECKIDENT ('readings', RESEED, 1) WITH NO_INFOMSGS")
        connection.commit()
        cursor=connection.cursor()
        cursor.execute("SELECT TOP(1) id,valorActual FROM sensors ORDER BY id")
        sensor=cursor.fetchone()
        if sensor:
            cursor.execute("INSERT INTO readings(sensorId,valor,fechaHora) OUTPUT inserted.id VALUES(%s,%s,SYSUTCDATETIME())",sensor)
            identifier=cursor.fetchone()[0]
            assert identifier>0, "Reading IDs must be positive"
            connection.rollback()
            cursor=connection.cursor()
            cursor.execute("SELECT COUNT(*) FROM readings")
            assert cursor.fetchone()[0]==0, "Probe must not persist a reading"
    print("PASS Post-import SQL identity: positive IDs; probe rolled back")
finally:
    connection.rollback()
    connection.close()
