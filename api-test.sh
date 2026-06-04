#!/bin/bash
# Script de ejemplo para probar la API
# Uso: bash api-test.sh

BASE_URL="http://localhost:8000"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123456"
USER_EMAIL="usuario@example.com"
USER_PASSWORD="user123456"

echo "🧪 Tests de API - Sistema de Gestión Documental"
echo "================================================"
echo "URL Base: $BASE_URL"
echo ""

# Color
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir resultado
print_result() {
    local status=$1
    local message=$2
    
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✅ $message${NC}"
    else
        echo -e "${RED}❌ $message${NC}"
    fi
    echo ""
}

# 1. Health Check
echo "1️⃣  Probando Health Check..."
response=$(curl -s "$BASE_URL/health")
if echo "$response" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Servidor está activo${NC}"
    echo "   Respuesta: $response"
else
    echo -e "${RED}❌ Servidor no responde${NC}"
    exit 1
fi
echo ""

# 2. Registrar usuario admin
echo "2️⃣  Registrando usuario admin..."
admin_response=$(curl -s -X POST "$BASE_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$ADMIN_EMAIL\",
        \"password\": \"$ADMIN_PASSWORD\",
        \"role\": \"admin\"
    }")
echo "   Email: $ADMIN_EMAIL"
echo "   Respuesta: $admin_response"
echo ""

# 3. Registrar usuario normal
echo "3️⃣  Registrando usuario normal..."
user_response=$(curl -s -X POST "$BASE_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$USER_EMAIL\",
        \"password\": \"$USER_PASSWORD\",
        \"role\": \"user\"
    }")
echo "   Email: $USER_EMAIL"
echo "   Respuesta: $user_response"
echo ""

# 4. Login usuario normal
echo "4️⃣  Haciendo login con usuario normal..."
token_response=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$USER_EMAIL\",
        \"password\": \"$USER_PASSWORD\"
    }")
echo "   Respuesta: $token_response"

# Extraer token
USER_TOKEN=$(echo "$token_response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$USER_TOKEN" ]; then
    echo -e "${RED}❌ No se pudo obtener token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Token obtenido: ${USER_TOKEN:0:20}...${NC}"
echo ""

# 5. Probar ruta protegida
echo "5️⃣  Accediendo a ruta protegida con token..."
protected_response=$(curl -s "$BASE_URL/health" \
    -H "Authorization: Bearer $USER_TOKEN")
echo "   Respuesta: $protected_response"
echo ""

# 6. Intentar login con credenciales incorrectas
echo "6️⃣  Intentando login con credenciales incorrectas..."
invalid_response=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$USER_EMAIL\",
        \"password\": \"contraseña_incorrecta\"
    }")
echo "   Respuesta: $invalid_response"

if echo "$invalid_response" | grep -q "Email o contraseña incorrectos"; then
    echo -e "${GREEN}✅ Validación correcta (rechaza credenciales inválidas)${NC}"
else
    echo -e "${YELLOW}⚠️  Respuesta inesperada${NC}"
fi
echo ""

# 7. Intentar registrar usuario duplicado
echo "7️⃣  Intentando registrar usuario duplicado..."
duplicate_response=$(curl -s -X POST "$BASE_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$USER_EMAIL\",
        \"password\": \"$USER_PASSWORD\"
    }")
echo "   Respuesta: $duplicate_response"

if echo "$duplicate_response" | grep -q "ya está registrado"; then
    echo -e "${GREEN}✅ Validación correcta (rechaza email duplicado)${NC}"
else
    echo -e "${YELLOW}⚠️  Respuesta inesperada${NC}"
fi
echo ""

echo "================================================"
echo -e "${GREEN}✅ Tests completados${NC}"
echo ""
echo "Información útil:"
echo "- Swagger UI: $BASE_URL/docs"
echo "- ReDoc: $BASE_URL/redoc"
echo "- API Base: $BASE_URL/api/v1"
echo ""
