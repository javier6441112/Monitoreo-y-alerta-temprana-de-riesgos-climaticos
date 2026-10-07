IF DB_ID(N'ClimateRiskDb') IS NULL
BEGIN
    CREATE DATABASE [ClimateRiskDb];
END;
GO

USE [ClimateRiskDb];
GO

IF OBJECT_ID(N'dbo.Comunidades', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Comunidades (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(200) NOT NULL UNIQUE,
        Municipio NVARCHAR(100) NOT NULL,
        Departamento NVARCHAR(100) NOT NULL,
        Pais NVARCHAR(100) NOT NULL,
        Latitud DECIMAL(9,6) NULL,
        Longitud DECIMAL(9,6) NULL,
        Descripcion NVARCHAR(500) NULL,
        Activo BIT NOT NULL DEFAULT 1
    );
END;
GO

IF OBJECT_ID(N'dbo.Usuarios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuarios (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Username NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(500) NOT NULL,
        Nombre NVARCHAR(200) NOT NULL,
        Rol NVARCHAR(50) NOT NULL,
        Activo BIT NOT NULL DEFAULT 1,
        FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UltimoAcceso DATETIME2 NULL
    );
END;
GO

IF OBJECT_ID(N'dbo.Sensores', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Sensores (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(200) NOT NULL,
        Codigo NVARCHAR(50) NOT NULL UNIQUE,
        Tipo NVARCHAR(50) NOT NULL,
        Unidad NVARCHAR(30) NOT NULL,
        ComunidadId INT NOT NULL,
        Latitud DECIMAL(9,6) NULL,
        Longitud DECIMAL(9,6) NULL,
        Activo BIT NOT NULL DEFAULT 1,
        FechaInstalacion DATETIME2 NULL,
        Descripcion NVARCHAR(500) NULL,
        FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        ValorActual DECIMAL(18,3) NOT NULL DEFAULT 0,
        UltimaLectura DATETIME2 NULL,
        CONSTRAINT FK_Sensores_Comunidades FOREIGN KEY (ComunidadId) REFERENCES dbo.Comunidades(Id)
    );
END;
GO

IF OBJECT_ID(N'dbo.LecturasSensores', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LecturasSensores (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        SensorId INT NOT NULL,
        Valor DECIMAL(18,3) NOT NULL,
        FechaHora DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_LecturasSensores_Sensores FOREIGN KEY (SensorId) REFERENCES dbo.Sensores(Id)
    );
END;
GO

IF OBJECT_ID(N'dbo.ConfiguracionAlertas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConfiguracionAlertas (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(200) NOT NULL DEFAULT '',
        TipoSensor NVARCHAR(50) NOT NULL,
        ValorMinimo DECIMAL(18,3) NULL,
        ValorMaximo DECIMAL(18,3) NULL,
        Nivel NVARCHAR(20) NOT NULL,
        Fenomeno NVARCHAR(50) NOT NULL,
        Mensaje NVARCHAR(500) NOT NULL,
        Activo BIT NOT NULL DEFAULT 1,
        FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID(N'dbo.Alertas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Alertas (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        SensorId INT NOT NULL,
        ConfiguracionAlertaId INT NULL,
        Nivel NVARCHAR(20) NOT NULL DEFAULT 'VERDE',
        Fenomeno NVARCHAR(50) NOT NULL,
        Mensaje NVARCHAR(500) NOT NULL,
        ValorDetectado DECIMAL(18,3) NOT NULL DEFAULT 0,
        ValorMinimo DECIMAL(18,3) NULL,
        ValorMaximo DECIMAL(18,3) NULL,
        Estado NVARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
        Activa BIT NOT NULL DEFAULT 1,
        AtendidaPorId INT NULL,
        FechaAtencion DATETIME2 NULL,
        CerradaPorId INT NULL,
        FechaCierre DATETIME2 NULL,
        FechaHora DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Alertas_Sensores FOREIGN KEY (SensorId) REFERENCES dbo.Sensores(Id),
        CONSTRAINT FK_Alertas_ConfiguracionAlertas FOREIGN KEY (ConfiguracionAlertaId) REFERENCES dbo.ConfiguracionAlertas(Id),
        CONSTRAINT FK_Alertas_Usuarios_Atendida FOREIGN KEY (AtendidaPorId) REFERENCES dbo.Usuarios(Id),
        CONSTRAINT FK_Alertas_Usuarios_Cerrada FOREIGN KEY (CerradaPorId) REFERENCES dbo.Usuarios(Id)
    );
END;
GO

IF OBJECT_ID(N'dbo.HistorialEventos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HistorialEventos (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        AlertaId INT NULL,
        SensorId INT NOT NULL,
        Fenomeno NVARCHAR(50) NOT NULL,
        Nivel NVARCHAR(20) NOT NULL,
        Mensaje NVARCHAR(500) NOT NULL,
        FechaHora DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_HistorialEventos_Sensores FOREIGN KEY (SensorId) REFERENCES dbo.Sensores(Id)
    );
END;
GO

IF OBJECT_ID(N'dbo.Bitacora', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Bitacora (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UsuarioId INT NULL,
        Usuario NVARCHAR(100) NOT NULL,
        Accion NVARCHAR(100) NOT NULL,
        Descripcion NVARCHAR(500) NOT NULL,
        FechaHora DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Comunidades)
BEGIN
    INSERT INTO dbo.Comunidades (Nombre, Municipio, Departamento, Pais, Latitud, Longitud, Descripcion, Activo)
    VALUES ('Comunidad Central', 'San Salvador', 'San Salvador', 'El Salvador', 13.6989, -89.1914, 'Comunidad principal de monitoreo', 1);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Username = 'admin')
BEGIN
    INSERT INTO dbo.Usuarios (Username, PasswordHash, Nombre, Rol, Activo, FechaCreacion)
    VALUES ('admin', 'PBKDF2$100000$QHRT0g==$', 'Administrador', 'ADMIN', 1, SYSUTCDATETIME());
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE Username = 'operador')
BEGIN
    INSERT INTO dbo.Usuarios (Username, PasswordHash, Nombre, Rol, Activo, FechaCreacion)
    VALUES ('operador', 'PBKDF2$100000$QHRT0g==$', 'Operador', 'OPERADOR', 1, SYSUTCDATETIME());
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Sensores)
BEGIN
    INSERT INTO dbo.Sensores (Nombre, Codigo, Tipo, Unidad, ComunidadId, Latitud, Longitud, Activo, FechaInstalacion, Descripcion, FechaCreacion, ValorActual, UltimaLectura)
    VALUES
        ('Sensor Temperatura 01', 'TEMP-001', 'TEMPERATURA', '°C', 1, 13.6989, -89.1914, 1, SYSUTCDATETIME(), 'Sensor de temperatura central', SYSUTCDATETIME(), 27.5, DATEADD(MINUTE, -5, SYSUTCDATETIME())),
        ('Sensor Humedad 01', 'HUM-001', 'HUMEDAD', '%', 1, 13.6989, -89.1914, 1, SYSUTCDATETIME(), 'Sensor de humedad central', SYSUTCDATETIME(), 78.0, DATEADD(MINUTE, -4, SYSUTCDATETIME())),
        ('Sensor Viento 01', 'VIND-001', 'VIENTO', 'km/h', 1, 13.6989, -89.1914, 1, SYSUTCDATETIME(), 'Sensor de viento central', SYSUTCDATETIME(), 42.0, DATEADD(MINUTE, -3, SYSUTCDATETIME())),
        ('Sensor Lluvia 01', 'LLUV-001', 'LLUVIA', 'mm/h', 1, 13.6989, -89.1914, 1, SYSUTCDATETIME(), 'Sensor de lluvia central', SYSUTCDATETIME(), 18.5, DATEADD(MINUTE, -2, SYSUTCDATETIME())),
        ('Sensor Río 01', 'RIO-001', 'NIVEL_RIO', 'm', 1, 13.6989, -89.1914, 1, SYSUTCDATETIME(), 'Sensor de nivel del río', SYSUTCDATETIME(), 2.8, DATEADD(MINUTE, -1, SYSUTCDATETIME()));
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.ConfiguracionAlertas)
BEGIN
    INSERT INTO dbo.ConfiguracionAlertas (Nombre, TipoSensor, ValorMinimo, ValorMaximo, Nivel, Fenomeno, Mensaje, Activo, FechaCreacion)
    VALUES
        ('Río amarillo', 'NIVEL_RIO', 2.5, NULL, 'AMARILLO', 'INUNDACION', 'El nivel del río está elevado.', 1, SYSUTCDATETIME()),
        ('Río naranja', 'NIVEL_RIO', 3.5, NULL, 'NARANJA', 'INUNDACION', 'El nivel del río está en alerta moderada.', 1, SYSUTCDATETIME()),
        ('Río rojo', 'NIVEL_RIO', 4.5, NULL, 'ROJO', 'INUNDACION', 'El nivel del río supera el límite de seguridad.', 1, SYSUTCDATETIME()),
        ('Viento amarillo', 'VIENTO', 40.0, NULL, 'AMARILLO', 'TORMENTA', 'Se registró viento fuerte.', 1, SYSUTCDATETIME()),
        ('Viento naranja', 'VIENTO', 60.0, NULL, 'NARANJA', 'TORMENTA', 'La velocidad del viento está alta.', 1, SYSUTCDATETIME()),
        ('Viento rojo', 'VIENTO', 80.0, NULL, 'ROJO', 'TORMENTA', 'La velocidad del viento supera el límite seguro.', 1, SYSUTCDATETIME());
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.LecturasSensores)
BEGIN
    INSERT INTO dbo.LecturasSensores (SensorId, Valor, FechaHora)
    VALUES
        (1, 27.5, DATEADD(MINUTE, -10, SYSUTCDATETIME())),
        (2, 78.0, DATEADD(MINUTE, -8, SYSUTCDATETIME())),
        (3, 42.0, DATEADD(MINUTE, -7, SYSUTCDATETIME())),
        (4, 18.5, DATEADD(MINUTE, -5, SYSUTCDATETIME())),
        (5, 2.8, DATEADD(MINUTE, -4, SYSUTCDATETIME()));
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Alertas)
BEGIN
    INSERT INTO dbo.Alertas (SensorId, ConfiguracionAlertaId, Nivel, Fenomeno, Mensaje, ValorDetectado, ValorMinimo, ValorMaximo, Estado, Activa, FechaHora)
    VALUES
        (5, 1, 'AMARILLO', 'INUNDACION', 'El nivel del río está elevado.', 2.8, 2.5, NULL, 'ACTIVA', 1, DATEADD(MINUTE, -2, SYSUTCDATETIME())),
        (3, 4, 'AMARILLO', 'TORMENTA', 'Velocidad del viento por encima del nivel normal.', 42.0, 40.0, NULL, 'ACTIVA', 1, DATEADD(MINUTE, -1, SYSUTCDATETIME()));
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.HistorialEventos)
BEGIN
    INSERT INTO dbo.HistorialEventos (AlertaId, SensorId, Fenomeno, Nivel, Mensaje, FechaHora)
    VALUES
        (1, 5, 'INUNDACION', 'AMARILLO', 'Nivel del río elevado.', DATEADD(MINUTE, -5, SYSUTCDATETIME())),
        (2, 3, 'TORMENTA', 'AMARILLO', 'Viento moderadamente alto.', DATEADD(MINUTE, -4, SYSUTCDATETIME()));
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Bitacora)
BEGIN
    INSERT INTO dbo.Bitacora (UsuarioId, Usuario, Accion, Descripcion, FechaHora)
    VALUES (1, 'admin', 'LOGIN', 'Inicio de sesión del administrador.', DATEADD(MINUTE, -20, SYSUTCDATETIME()));
END;
GO
