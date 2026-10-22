param([int]$Port = 5087)

$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskBackend = Join-Path $taskRoot 'Backend'
$taskAssembly = Join-Path $taskBackend 'bin/Debug/net10.0/WeatherRisk.Api.dll'
if (-not (Test-Path -LiteralPath $taskAssembly)) {
    throw 'Primero ejecuta dotnet build Backend/WeatherRisk.Api.csproj.'
}

$taskUrl = "http://127.0.0.1:$Port"
$taskClient = New-Object System.Net.Sockets.TcpClient
try {
    $taskClient.Connect('127.0.0.1', $Port)
    throw "El puerto $Port está ocupado; usa -Port con otro puerto."
} catch [System.Net.Sockets.SocketException] {
    # El puerto libre es necesario para no comprobar otra aplicación.
} finally {
    $taskClient.Dispose()
}

$taskLog = Join-Path ([System.IO.Path]::GetTempPath()) ("weather-risk-smoke-" + [guid]::NewGuid().ToString('N'))
$taskProcess = Start-Process -FilePath 'dotnet' -ArgumentList @('bin/Debug/net10.0/WeatherRisk.Api.dll', '--urls', $taskUrl) -WorkingDirectory $taskBackend -WindowStyle Hidden -PassThru -RedirectStandardOutput "$taskLog.out" -RedirectStandardError "$taskLog.err"
try {
    $taskReady = $false
    for ($taskAttempt = 0; $taskAttempt -lt 50; $taskAttempt++) {
        if ($taskProcess.HasExited) { throw "La API terminó al arrancar. Consulta $taskLog.out y $taskLog.err" }
        try {
            $taskHealth = Invoke-RestMethod -Uri "$taskUrl/health" -TimeoutSec 1
            if ($taskHealth.service -eq 'weather-risk-api') { $taskReady = $true; break }
        } catch {
            Start-Sleep -Milliseconds 200
        }
    }
    if (-not $taskReady) { throw "La API no arrancó. Consulta $taskLog.out y $taskLog.err" }
    Write-Output 'PASS GET /health'

    $taskSwagger = Invoke-RestMethod -Uri "$taskUrl/swagger/v1/swagger.json" -TimeoutSec 5
    foreach ($taskPath in @('/api/Auth/login', '/api/comunidades', '/api/sensores', '/api/lecturas', '/api/Alertas', '/api/Dashboard', '/api/Historial', '/api/Bitacora')) {
        if ($null -eq $taskSwagger.paths.PSObject.Properties[$taskPath]) { throw "Falta ruta pública $taskPath" }
    }
    Write-Output 'PASS Contratos principales publicados en OpenAPI'

    foreach ($taskPath in @('/api/dashboard', '/api/comunidades', '/api/sensores', '/api/alertas', '/api/historial', '/api/usuarios', '/api/bitacora')) {
        $taskStatus = 0
        try {
            $taskResponse = Invoke-WebRequest -Uri "$taskUrl$taskPath" -UseBasicParsing -TimeoutSec 5
            $taskStatus = [int]$taskResponse.StatusCode
        } catch {
            if ($null -eq $_.Exception.Response) { throw }
            $taskStatus = [int]$_.Exception.Response.StatusCode
        }
        if ($taskStatus -ne 401) { throw "Se esperaba 401 en $taskPath; recibido $taskStatus" }
    }
    Write-Output 'PASS Acceso anónimo rechazado en APIs protegidas'
} finally {
    if (-not $taskProcess.HasExited) { Stop-Process -Id $taskProcess.Id }
}
