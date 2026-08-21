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
    VALUES (1, N'admin', N'admin123', N'Administrador', N'ADMIN', 1),
           (2, N'operador', N'operador123', N'Operador', N'OPERADOR', 1);
    SET IDENTITY_INSERT dbo.Usuarios OFF;
END;
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
           (N'VEIENTO', N'AMARILLO', 40, N'TORMENTA', N'Se registró viento fuerte.', 1),
           (N'VEIENTO', N'NARANJA', 60, N'TORMENTA', N'La velocidad del viento está alta.', 1),
           (N'VEIENTO', N'ROJO', 80, N'TORMENTA', N'La velocidad del viento supera el límite seguro.', 1);
END;
GO