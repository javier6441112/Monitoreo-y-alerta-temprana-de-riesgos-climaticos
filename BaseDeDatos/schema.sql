IF DB_ID(N'$(DatabaseName)') IS NULL
BEGIN
    DECLARE @createDatabase NVARCHAR(512) = N'CREATE DATABASE ' + QUOTENAME(N'$(DatabaseName)');
    EXEC sys.sp_executesql @createDatabase;
END;
GO

USE [$(DatabaseName)];
GO

IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users
    (
        UserId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
        UserName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(255) NOT NULL,
        PasswordHash NVARCHAR(500) NOT NULL,
        Role NVARCHAR(30) NOT NULL CONSTRAINT DF_Users_Role DEFAULT N'Operator',
        IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
        CreatedAt DATETIMEOFFSET(0) NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT UQ_Users_Email UNIQUE (Email),
        CONSTRAINT CK_Users_Role CHECK (Role IN (N'Administrator', N'Operator', N'Viewer'))
    );
END;
GO

IF OBJECT_ID(N'dbo.Sensors', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Sensors
    (
        SensorId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Sensors PRIMARY KEY,
        Name NVARCHAR(120) NOT NULL,
        SensorType NVARCHAR(30) NOT NULL,
        Unit NVARCHAR(20) NOT NULL,
        Community NVARCHAR(150) NOT NULL,
        Latitude DECIMAL(9,6) NULL,
        Longitude DECIMAL(9,6) NULL,
        IsActive BIT NOT NULL CONSTRAINT DF_Sensors_IsActive DEFAULT 1,
        CreatedAt DATETIMEOFFSET(0) NOT NULL CONSTRAINT DF_Sensors_CreatedAt DEFAULT SYSDATETIMEOFFSET(),
        UpdatedAt DATETIMEOFFSET(0) NULL,
        CONSTRAINT CK_Sensors_Type CHECK (SensorType IN (N'Temperature', N'Humidity', N'WindSpeed', N'Rainfall', N'RiverLevel'))
    );
END;
GO

IF OBJECT_ID(N'dbo.SensorReadings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SensorReadings
    (
        ReadingId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_SensorReadings PRIMARY KEY,
        SensorId INT NOT NULL,
        Value DECIMAL(12,3) NOT NULL,
        RecordedAt DATETIMEOFFSET(0) NOT NULL CONSTRAINT DF_SensorReadings_RecordedAt DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT FK_SensorReadings_Sensors FOREIGN KEY (SensorId) REFERENCES dbo.Sensors (SensorId)
    );

    CREATE INDEX IX_SensorReadings_SensorId_RecordedAt
        ON dbo.SensorReadings (SensorId, RecordedAt DESC);
END;
GO

IF OBJECT_ID(N'dbo.Alerts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Alerts
    (
        AlertId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Alerts PRIMARY KEY,
        SensorId INT NULL,
        Severity NVARCHAR(20) NOT NULL,
        Phenomenon NVARCHAR(30) NOT NULL,
        Message NVARCHAR(500) NOT NULL,
        DetectedAt DATETIMEOFFSET(0) NOT NULL CONSTRAINT DF_Alerts_DetectedAt DEFAULT SYSDATETIMEOFFSET(),
        ResolvedAt DATETIMEOFFSET(0) NULL,
        IsResolved BIT NOT NULL CONSTRAINT DF_Alerts_IsResolved DEFAULT 0,
        CONSTRAINT FK_Alerts_Sensors FOREIGN KEY (SensorId) REFERENCES dbo.Sensors (SensorId),
        CONSTRAINT CK_Alerts_Severity CHECK (Severity IN (N'Green', N'Yellow', N'Orange', N'Red')),
        CONSTRAINT CK_Alerts_Phenomenon CHECK (Phenomenon IN (N'Flood', N'Drought', N'Storm', N'Frost', N'Wildfire'))
    );

    CREATE INDEX IX_Alerts_DetectedAt ON dbo.Alerts (DetectedAt DESC);
END;
GO

IF OBJECT_ID(N'dbo.EventHistory', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EventHistory
    (
        EventId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_EventHistory PRIMARY KEY,
        AlertId BIGINT NULL,
        Phenomenon NVARCHAR(30) NOT NULL,
        Severity NVARCHAR(20) NOT NULL,
        Description NVARCHAR(500) NOT NULL,
        OccurredAt DATETIMEOFFSET(0) NOT NULL CONSTRAINT DF_EventHistory_OccurredAt DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT FK_EventHistory_Alerts FOREIGN KEY (AlertId) REFERENCES dbo.Alerts (AlertId),
        CONSTRAINT CK_EventHistory_Severity CHECK (Severity IN (N'Green', N'Yellow', N'Orange', N'Red')),
        CONSTRAINT CK_EventHistory_Phenomenon CHECK (Phenomenon IN (N'Flood', N'Drought', N'Storm', N'Frost', N'Wildfire'))
    );

    CREATE INDEX IX_EventHistory_OccurredAt ON dbo.EventHistory (OccurredAt DESC);
END;
GO

IF OBJECT_ID(N'dbo.AuditLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLog
    (
        AuditLogId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AuditLog PRIMARY KEY,
        UserId INT NULL,
        Action NVARCHAR(100) NOT NULL,
        EntityName NVARCHAR(100) NULL,
        EntityId NVARCHAR(100) NULL,
        Details NVARCHAR(MAX) NULL,
        CreatedAt DATETIMEOFFSET(0) NOT NULL CONSTRAINT DF_AuditLog_CreatedAt DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT FK_AuditLog_Users FOREIGN KEY (UserId) REFERENCES dbo.Users (UserId)
    );

    CREATE INDEX IX_AuditLog_CreatedAt ON dbo.AuditLog (CreatedAt DESC);
END;
GO
