$ErrorActionPreference = 'Stop'
$taskPath = Join-Path (Split-Path -Parent $PSScriptRoot) '.env'
if (Test-Path -LiteralPath $taskPath) { throw '.env ya existe. No se sobrescribió.' }
function New-TaskSecret {
    $taskBytes = New-Object byte[] 32
    $taskRng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $taskRng.GetBytes($taskBytes) } finally { $taskRng.Dispose() }
    return ([System.BitConverter]::ToString($taskBytes)).Replace('-','').ToLowerInvariant()
}
$taskLines = @(
    ('JWT_KEY='+(New-TaskSecret)),
    ('SERVICE_KEY='+(New-TaskSecret)),
    ('POSTGRES_PASSWORD='+(New-TaskSecret)),
    ('MSSQL_SA_PASSWORD=Aa1'+(New-TaskSecret)),
    ('MONGO_ROOT_PASSWORD='+(New-TaskSecret)),
    ('MONGO_REPORT_PASSWORD='+(New-TaskSecret)),
    ('MONGO_AUDIT_PASSWORD='+(New-TaskSecret)),
    'ADMIN_USERNAME=admin',
    ('ADMIN_PASSWORD=Aa1'+(New-TaskSecret)),
    'API_PORT=5000','FRONTEND_PORT=4200','BIND_ADDRESS=127.0.0.1','CORS_ORIGINS=http://localhost:4200'
)
[System.IO.File]::WriteAllLines($taskPath,$taskLines,(New-Object System.Text.UTF8Encoding $false))
Write-Output '.env creado con claves aleatorias. Las credenciales no se muestran en consola.'
