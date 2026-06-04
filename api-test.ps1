# Script de ejemplo para probar la API en Windows
# Uso: powershell -ExecutionPolicy Bypass -File api-test.ps1

param(
    [string]$BaseUrl = "http://localhost:8000"
)

Write-Host "🧪 Tests de API - Sistema de Gestión Documental" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "URL Base: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

# Variables
$AdminEmail = "admin@example.com"
$AdminPassword = "admin123456"
$UserEmail = "usuario@example.com"
$UserPassword = "user123456"

# 1. Health Check
Write-Host "1️⃣  Probando Health Check..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest "$BaseUrl/health" -Method Get | ConvertFrom-Json
    Write-Host "✅ Servidor está activo" -ForegroundColor Green
    Write-Host "   Respuesta: $($response | ConvertTo-Json)"
}
catch {
    Write-Host "❌ Servidor no responde" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Registrar usuario admin
Write-Host "2️⃣  Registrando usuario admin..." -ForegroundColor Cyan
try {
    $body = @{
        email = $AdminEmail
        password = $AdminPassword
        role = "admin"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest "$BaseUrl/api/v1/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body | ConvertFrom-Json
    
    Write-Host "   Email: $AdminEmail" -ForegroundColor Yellow
    Write-Host "   ✅ Usuario admin creado" -ForegroundColor Green
}
catch {
    Write-Host "   ⚠️  Error: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# 3. Registrar usuario normal
Write-Host "3️⃣  Registrando usuario normal..." -ForegroundColor Cyan
try {
    $body = @{
        email = $UserEmail
        password = $UserPassword
        role = "user"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest "$BaseUrl/api/v1/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body | ConvertFrom-Json
    
    Write-Host "   Email: $UserEmail" -ForegroundColor Yellow
    Write-Host "   ✅ Usuario normal creado" -ForegroundColor Green
}
catch {
    Write-Host "   ⚠️  Error: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# 4. Login usuario normal
Write-Host "4️⃣  Haciendo login con usuario normal..." -ForegroundColor Cyan
try {
    $body = @{
        email = $UserEmail
        password = $UserPassword
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest "$BaseUrl/api/v1/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body | ConvertFrom-Json
    
    $UserToken = $response.access_token
    Write-Host "   ✅ Login exitoso" -ForegroundColor Green
    Write-Host "   Token: $($UserToken.Substring(0, 20))..." -ForegroundColor Yellow
}
catch {
    Write-Host "   ❌ Error en login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 5. Probar con token inválido
Write-Host "5️⃣  Probando validación de token..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest "$BaseUrl/health" `
        -Method Get `
        -Headers @{"Authorization" = "Bearer invalid-token"} | ConvertFrom-Json
    Write-Host "   ✅ Health check con token válido" -ForegroundColor Green
}
catch {
    Write-Host "   ⚠️  Esperado (token inválido rechazado)" -ForegroundColor Yellow
}
Write-Host ""

# 6. Login con credenciales incorrectas
Write-Host "6️⃣  Intentando login con credenciales incorrectas..." -ForegroundColor Cyan
try {
    $body = @{
        email = $UserEmail
        password = "contraseña_incorrecta"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest "$BaseUrl/api/v1/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body | ConvertFrom-Json
    
    Write-Host "   ❌ Debería haber rechazado las credenciales" -ForegroundColor Red
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✅ Correctamente rechazó credenciales inválidas" -ForegroundColor Green
    }
    else {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
Write-Host ""

# 7. Registrar usuario duplicado
Write-Host "7️⃣  Intentando registrar usuario duplicado..." -ForegroundColor Cyan
try {
    $body = @{
        email = $UserEmail
        password = $UserPassword
        role = "user"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest "$BaseUrl/api/v1/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body | ConvertFrom-Json
    
    Write-Host "   ❌ Debería haber rechazado el email duplicado" -ForegroundColor Red
}
catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "   ✅ Correctamente rechazó email duplicado" -ForegroundColor Green
    }
    else {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "================================================" -ForegroundColor Green
Write-Host "✅ Tests completados" -ForegroundColor Green
Write-Host ""
Write-Host "Información útil:" -ForegroundColor Cyan
Write-Host "- Swagger UI: $BaseUrl/docs" -ForegroundColor Yellow
Write-Host "- ReDoc: $BaseUrl/redoc" -ForegroundColor Yellow
Write-Host "- API Base: $BaseUrl/api/v1" -ForegroundColor Yellow
Write-Host ""
