IF DB_ID(N'$(DatabaseName)') IS NULL
BEGIN
    DECLARE @createDatabase NVARCHAR(512) = N'CREATE DATABASE ' + QUOTENAME(N'$(DatabaseName)');
    EXEC sys.sp_executesql @createDatabase;
END;
GO

USE [$(DatabaseName)];
GO

IF OBJECT_ID(N'dbo.Usuarios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuarios
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Usuarios PRIMARY KEY,
        Username NVARCHAR(100) NOT NULL,
        PasswordHash NVARCHAR(500) NOT NULL,
        Nombre NVARCHAR(200) NOT NULL,
        Rol NVARCHAR(50) NOT NULL CONSTRAINT DF_Usuarios_Rol DEFAULT N'OPERADOR',
        Activo BIT NOT NULL CONSTRAINT DF_Usuarios_Activo DEFAULT 1,
        FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Usuarios_FechaCreacion DEFAULT GETUTCDATE()
    );
END;
GO

IF OBJECT_ID(N'dbo.Sensores', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Sensores
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Sensores PRIMARY KEY,
        Nombre NVARCHAR(200) NOT NULL,
        Tipo NVARCHAR(50) NOT NULL,
        Unidad NVARCHAR(30) NOT NULL,
        Activo BIT NOT NULL CONSTRAINT DF_Sensores_Activo DEFAULT 1,
        ComunidadId INT NOT NULL,
        FechaCreacion DATETIME2 NULL CONSTRAINT DF_Sensores_FechaCreacion DEFAULT GETUTCDATE(),
        ValorActual DECIMAL(18,3) NOT NULL CONSTRAINT DF_Sensores_ValorActual DEFAULT 0,
        UltimaLectura DATETIME2 NULL
    );
END;
GO

IF OBJECT_ID(N'dbo.LecturasSensores', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LecturasSensores
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LecturasSensores PRIMARY KEY,
        SensorId INT NOT NULL,
        Valor DECIMAL(18,3) NOT NULL,
        FechaHora DATETIME2 NOT NULL CONSTRAINT DF_LecturasSensores_FechaHora DEFAULT GETUTCDATE(),
        CONSTRAINT FK_LecturasSensores_Sensores FOREIGN KEY (SensorId) REFERENCES dbo.Sensores (Id)
    );
END;
GO

IF OBJECT_ID(N'dbo.Alertas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Alertas
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Alertas PRIMARY KEY,
        SensorId INT NOT NULL,
        Nivel NVARCHAR(20) NOT NULL,
        Fenomeno NVARCHAR(50) NOT NULL,
        Mensaje NVARCHAR(500) NOT NULL,
        ValorDetectado DECIMAL(18,3) NOT NULL,
        FechaHora DATETIME2 NOT NULL CONSTRAINT DF_Alertas_FechaHora DEFAULT GETUTCDATE(),
        Activa BIT NOT NULL CONSTRAINT DF_Alertas_Activa DEFAULT 1,
        CONSTRAINT FK_Alertas_Sensores FOREIGN KEY (SensorId) REFERENCES dbo.Sensores (Id)
    );
END;
GO

IF OBJECT_ID(N'dbo.HistorialEventos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HistorialEventos
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_HistorialEventos PRIMARY KEY,
        AlertaId INT NULL,
        SensorId INT NOT NULL,
        Fenomeno NVARCHAR(50) NOT NULL,
        Nivel NVARCHAR(20) NOT NULL,
        Mensaje NVARCHAR(500) NOT NULL,
        FechaHora DATETIME2 NOT NULL CONSTRAINT DF_HistorialEventos_FechaHora DEFAULT GETUTCDATE(),
        CONSTRAINT FK_HistorialEventos_Alertas FOREIGN KEY (AlertaId) REFERENCES dbo.Alertas (Id),
        CONSTRAINT FK_HistorialEventos_Sensores FOREIGN KEY (SensorId) REFERENCES dbo.Sensores (Id)
    );
END;
GO

IF OBJECT_ID(N'dbo.Bitacora', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Bitacora
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Bitacora PRIMARY KEY,
        UsuarioId INT NULL,
        Usuario NVARCHAR(100) NOT NULL,
        Accion NVARCHAR(100) NOT NULL,
        Descripcion NVARCHAR(500) NOT NULL,
        FechaHora DATETIME2 NOT NULL CONSTRAINT DF_Bitacora_FechaHora DEFAULT GETUTCDATE(),
        CONSTRAINT FK_Bitacora_Usuarios FOREIGN KEY (UsuarioId) REFERENCES dbo.Usuarios (Id)
    );
END;
GO

IF OBJECT_ID(N'dbo.ConfiguracionAlertas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConfiguracionAlertas
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ConfiguracionAlertas PRIMARY KEY,
        TipoSensor NVARCHAR(50) NOT NULL,
        Nivel NVARCHAR(20) NOT NULL,
        ValorMinimo DECIMAL(18,3) NOT NULL,
        Fenomeno NVARCHAR(50) NOT NULL,
        Mensaje NVARCHAR(500) NOT NULL,
        Activo BIT NOT NULL CONSTRAINT DF_ConfiguracionAlertas_Activo DEFAULT 1,
        FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_ConfiguracionAlertas_FechaCreacion DEFAULT GETUTCDATE()
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Username = N'admin')
BEGIN
    SET IDENTITY_INSERT dbo.Usuarios ON;
    INSERT INTO dbo.Usuarios (Id, Username, PasswordHash, Nombre, Rol, Activo)
    VALUES (1, N'admin', N'PBKDF2$100000$hmOdcEh1OZzlNQnvqDo0rw==$GtGagtChy2EN2eAzY2LP7ayAVaGWMAnCwxnRA5mlezM=', N'Administrador', N'ADMIN', 1),
           (2, N'operador', N'PBKDF2$100000$sWcBpI22Qr1FxRrLUGBTmg==$PL2KOrTqUA4Bt9/nC77wnkp3hp2cEdKQrhRF1dBK+FA=', N'Operador', N'OPERADOR', 1);
    SET IDENTITY_INSERT dbo.Usuarios OFF;
END;
GO

UPDATE dbo.Usuarios
SET PasswordHash = N'PBKDF2$100000$hmOdcEh1OZzlNQnvqDo0rw==$GtGagtChy2EN2eAzY2LP7ayAVaGWMAnCwxnRA5mlezM='
WHERE Username = N'admin' AND PasswordHash IN (N'admin123', N'PBKDF2$100000$QHRT0g==$');
GO

UPDATE dbo.Usuarios
SET PasswordHash = N'PBKDF2$100000$sWcBpI22Qr1FxRrLUGBTmg==$PL2KOrTqUA4Bt9/nC77wnkp3hp2cEdKQrhRF1dBK+FA='
WHERE Username = N'operador' AND PasswordHash IN (N'operador123', N'PBKDF2$100000$QHRT0g==$');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Sensores)
BEGIN
    SET IDENTITY_INSERT dbo.Sensores ON;
    INSERT INTO dbo.Sensores (Id, Nombre, Tipo, Unidad, Activo, ComunidadId, ValorActual, UltimaLectura)
    VALUES (1, N'Sensor Temperatura 01', N'TEMPERATURA', N'C', 1, 1, 27.5, DATEADD(MINUTE, -5, GETUTCDATE())),
           (2, N'Sensor Humedad 01', N'HUMEDAD', N'%', 1, 1, 78, DATEADD(MINUTE, -4, GETUTCDATE())),
           (3, N'Sensor Viento 01', N'VIENTO', N'km/h', 1, 1, 42, DATEADD(MINUTE, -3, GETUTCDATE())),
           (4, N'Sensor Lluvia 01', N'LLUVIA', N'mm/h', 1, 1, 18.5, DATEADD(MINUTE, -2, GETUTCDATE())),
           (5, N'Sensor Rio 01', N'NIVEL_RIO', N'm', 1, 1, 2.8, DATEADD(MINUTE, -1, GETUTCDATE()));
    SET IDENTITY_INSERT dbo.Sensores OFF;
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.ConfiguracionAlertas)
BEGIN
    INSERT INTO dbo.ConfiguracionAlertas (TipoSensor, Nivel, ValorMinimo, Fenomeno, Mensaje, Activo)
    VALUES (N'NIVEL_RIO', N'AMARILLO', 2.5, N'INUNDACION', N'El nivel del río está elevado.', 1),
           (N'NIVEL_RIO', N'NARANJA', 3.5, N'INUNDACION', N'El nivel del río está en alerta moderada.', 1),
           (N'NIVEL_RIO', N'ROJO', 4.5, N'INUNDACION', N'El nivel del río supera el límite de seguridad.', 1),
           (N'VIENTO', N'AMARILLO', 40, N'TORMENTA', N'Se registró viento fuerte.', 1),
           (N'VIENTO', N'NARANJA', 60, N'TORMENTA', N'La velocidad del viento está alta.', 1),
           (N'VIENTO', N'ROJO', 80, N'TORMENTA', N'La velocidad del viento supera el límite seguro.', 1);
END;
GO

IF OBJECT_ID(N'dbo.Comunidades', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Comunidades
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Comunidades PRIMARY KEY,
        Nombre NVARCHAR(200) NOT NULL,
        Municipio NVARCHAR(100) NOT NULL,
        Departamento NVARCHAR(100) NOT NULL,
        Pais NVARCHAR(100) NOT NULL,
        Latitud DECIMAL(9,6) NULL,
        Longitud DECIMAL(9,6) NULL,
        Descripcion NVARCHAR(500) NULL,
        Activo BIT NOT NULL CONSTRAINT DF_Comunidades_Activo DEFAULT 1,
        CONSTRAINT UQ_Comunidades_Nombre UNIQUE (Nombre)
    );
END;
GO

IF OBJECT_ID(N'dbo.RevokedTokens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RevokedTokens
    (
        TokenId NVARCHAR(64) NOT NULL CONSTRAINT PK_RevokedTokens PRIMARY KEY,
        ExpiresAtUtc DATETIME2 NOT NULL
    );
END;
GO

IF COL_LENGTH(N'dbo.Usuarios', N'UltimoAcceso') IS NULL
    ALTER TABLE dbo.Usuarios ADD UltimoAcceso DATETIME2 NULL;
GO

IF COL_LENGTH(N'dbo.Sensores', N'Codigo') IS NULL
    ALTER TABLE dbo.Sensores ADD Codigo NVARCHAR(50) NULL;
GO

IF COL_LENGTH(N'dbo.Sensores', N'Latitud') IS NULL
    ALTER TABLE dbo.Sensores ADD Latitud DECIMAL(9,6) NULL;
GO

IF COL_LENGTH(N'dbo.Sensores', N'Longitud') IS NULL
    ALTER TABLE dbo.Sensores ADD Longitud DECIMAL(9,6) NULL;
GO

IF COL_LENGTH(N'dbo.Sensores', N'FechaInstalacion') IS NULL
    ALTER TABLE dbo.Sensores ADD FechaInstalacion DATETIME2 NULL;
GO

IF COL_LENGTH(N'dbo.Sensores', N'Descripcion') IS NULL
    ALTER TABLE dbo.Sensores ADD Descripcion NVARCHAR(500) NULL;
GO

UPDATE dbo.Sensores
SET Codigo = CONCAT(N'SENSOR-', Id)
WHERE Codigo IS NULL;
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Sensores') AND name = N'Codigo' AND is_nullable = 1)
    ALTER TABLE dbo.Sensores ALTER COLUMN Codigo NVARCHAR(50) NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Sensores') AND name = N'UX_Sensores_Codigo')
    CREATE UNIQUE INDEX UX_Sensores_Codigo ON dbo.Sensores (Codigo);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Comunidades)
BEGIN
    SET IDENTITY_INSERT dbo.Comunidades ON;
    INSERT INTO dbo.Comunidades (Id, Nombre, Municipio, Departamento, Pais, Activo)
    VALUES (1, N'Comunidad Central', N'San Salvador', N'San Salvador', N'El Salvador', 1);
    SET IDENTITY_INSERT dbo.Comunidades OFF;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Sensores_Comunidades')
    ALTER TABLE dbo.Sensores ADD CONSTRAINT FK_Sensores_Comunidades
        FOREIGN KEY (ComunidadId) REFERENCES dbo.Comunidades (Id);
GO

IF COL_LENGTH(N'dbo.ConfiguracionAlertas', N'Nombre') IS NULL
    ALTER TABLE dbo.ConfiguracionAlertas ADD Nombre NVARCHAR(200) NOT NULL
        CONSTRAINT DF_ConfiguracionAlertas_Nombre DEFAULT N'';
GO

IF COL_LENGTH(N'dbo.ConfiguracionAlertas', N'ValorMaximo') IS NULL
    ALTER TABLE dbo.ConfiguracionAlertas ADD ValorMaximo DECIMAL(18,3) NULL;
GO

IF COL_LENGTH(N'dbo.Alertas', N'ConfiguracionAlertaId') IS NULL
    ALTER TABLE dbo.Alertas ADD ConfiguracionAlertaId INT NULL;
GO

IF COL_LENGTH(N'dbo.Alertas', N'ValorMinimo') IS NULL
    ALTER TABLE dbo.Alertas ADD ValorMinimo DECIMAL(18,3) NULL;
GO

IF COL_LENGTH(N'dbo.Alertas', N'ValorMaximo') IS NULL
    ALTER TABLE dbo.Alertas ADD ValorMaximo DECIMAL(18,3) NULL;
GO

IF COL_LENGTH(N'dbo.Alertas', N'Estado') IS NULL
    ALTER TABLE dbo.Alertas ADD Estado NVARCHAR(20) NULL;
GO

UPDATE dbo.Alertas
SET Estado = CASE WHEN Activa = 1 THEN N'ACTIVA' ELSE N'CERRADA' END
WHERE Estado IS NULL;
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Alertas') AND name = N'Estado' AND is_nullable = 1)
    ALTER TABLE dbo.Alertas ALTER COLUMN Estado NVARCHAR(20) NOT NULL;
GO

IF OBJECT_ID(N'dbo.DF_Alertas_Estado', N'D') IS NULL
    ALTER TABLE dbo.Alertas ADD CONSTRAINT DF_Alertas_Estado DEFAULT N'ACTIVA' FOR Estado;
GO

IF COL_LENGTH(N'dbo.Alertas', N'AtendidaPorId') IS NULL
    ALTER TABLE dbo.Alertas ADD AtendidaPorId INT NULL;
GO

IF COL_LENGTH(N'dbo.Alertas', N'FechaAtencion') IS NULL
    ALTER TABLE dbo.Alertas ADD FechaAtencion DATETIME2 NULL;
GO

IF COL_LENGTH(N'dbo.Alertas', N'CerradaPorId') IS NULL
    ALTER TABLE dbo.Alertas ADD CerradaPorId INT NULL;
GO

IF COL_LENGTH(N'dbo.Alertas', N'FechaCierre') IS NULL
    ALTER TABLE dbo.Alertas ADD FechaCierre DATETIME2 NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Alertas_Sensores')
    ALTER TABLE dbo.Alertas ADD CONSTRAINT FK_Alertas_Sensores
        FOREIGN KEY (SensorId) REFERENCES dbo.Sensores (Id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Alertas_ConfiguracionAlertas')
    ALTER TABLE dbo.Alertas ADD CONSTRAINT FK_Alertas_ConfiguracionAlertas
        FOREIGN KEY (ConfiguracionAlertaId) REFERENCES dbo.ConfiguracionAlertas (Id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Alertas_Usuarios_Atendida')
    ALTER TABLE dbo.Alertas ADD CONSTRAINT FK_Alertas_Usuarios_Atendida
        FOREIGN KEY (AtendidaPorId) REFERENCES dbo.Usuarios (Id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Alertas_Usuarios_Cerrada')
    ALTER TABLE dbo.Alertas ADD CONSTRAINT FK_Alertas_Usuarios_Cerrada
        FOREIGN KEY (CerradaPorId) REFERENCES dbo.Usuarios (Id);
GO