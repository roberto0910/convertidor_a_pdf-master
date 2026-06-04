# 🚀 Guía de Inicio Rápido

## 1️⃣ Instalación Inicial (⏱️ 5 minutos)

### Paso 1: Crear entorno virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### Paso 2: Instalar dependencias

```bash
pip install -r requirements.txt
```

### Paso 3: Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env
# o en Windows
copy .env.example .env
```

⚠️ **Nota**: Cambia `SECRET_KEY` en `.env` por una clave segura:

```bash
# Generar clave segura
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 2️⃣ Ejecutar la Aplicación (⏱️ 1 minuto)

```bash
# Modo desarrollo (con reload)
uvicorn app.main:app --reload

# O alternativamente
python -m uvicorn app.main:app --reload

# Modo producción (sin reload)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

✅ La app estará en: **http://localhost:8000**

## 3️⃣ Probar la API (⏱️ 5 minutos)

### Opción A: Usar Swagger UI (Recomendado)

1. Abre en navegador: **http://localhost:8000/docs**
2. Haz clic en "Try it out" en los endpoints
3. Completa los datos y prueba

### Opción B: Usar cURL

#### Registrar usuario
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "password123",
    "role": "user"
  }'
```

**Respuesta esperada:**
```json
{
  "id": 1,
  "email": "usuario@example.com",
  "role": "user",
  "is_active": true,
  "digital_signature_path": null
}
```

#### Login y obtener token
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "password123"
  }'
```

**Respuesta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### Copiar el token y usarlo en requests protegidos

```bash
curl -X GET "http://localhost:8000/health" \
  -H "Authorization: Bearer <tu_token_aqui>"
```

## 4️⃣ Documentación Disponible

| Documento | Descripción |
|-----------|-------------|
| [README.md](README.md) | Documentación general y uso |
| [TECHNICAL_DOCS.md](TECHNICAL_DOCS.md) | Detalles técnicos de la arquitectura |
| [STRUCTURE.md](STRUCTURE.md) | Árbol de directorios explicado |
| [QUICKSTART.md](QUICKSTART.md) | Esta guía |

## 5️⃣ Endpoint Principales

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Crear nuevo usuario |
| POST | `/api/v1/auth/login` | Login con email/password (JSON) |
| POST | `/api/v1/auth/login/access-token` | Login con OAuth2PasswordRequestForm |

### Utilidad

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Información de bienvenida |
| GET | `/health` | Verificar que la app está activa |
| GET | `/docs` | Documentación Swagger |
| GET | `/redoc` | Documentación ReDoc |

## 6️⃣ Estructura del Proyecto

```
proyecto/
├── app/
│   ├── api/              ← Rutas/endpoints
│   ├── core/             ← Configuración y seguridad
│   ├── db/               ← Base de datos
│   ├── models/           ← Modelos ORM
│   ├── schemas/          ← Validación (Pydantic)
│   └── main.py           ← Punto de entrada
├── tests/                ← Tests
├── requirements.txt      ← Dependencias
├── .env.example          ← Variables de entorno
└── README.md             ← Documentación
```

## 7️⃣ Detener la Aplicación

Presiona en la terminal:
```
CTRL + C
```

## ✅ Verificación Rápida

Si todo funcionó correctamente:

1. ✅ La terminal muestra "Uvicorn running on http://127.0.0.1:8000"
2. ✅ Puedes acceder a http://localhost:8000/docs
3. ✅ Registro y login funcionan correctamente
4. ✅ Se crea el archivo `gestion_documental.db`

## 🆘 Solucionar Problemas

### Problema: "ModuleNotFoundError: No module named 'app'"

**Solución**: Asegúrate de ejecutar el comando desde la carpeta raíz del proyecto.

### Problema: "Port 8000 already in use"

**Solución**: Usa otro puerto:
```bash
uvicorn app.main:app --reload --port 8001
```

### Problema: Contraseña débil en registro

**Solución**: Las contraseñas deben tener mínimo 8 caracteres.

### Problema: "Invalid email" en login

**Solución**: Verifica que el email esté registrado exactamente igual.

## 📦 Dependencias Instaladas

- **FastAPI** - Framework web moderno
- **Uvicorn** - Servidor ASGI
- **SQLAlchemy** - ORM para base de datos
- **Pydantic** - Validación de datos
- **python-jose** - JWT
- **passlib** - Hash de contraseñas
- **python-dotenv** - Variables de entorno

## 🔄 Próximos Pasos (Semana 2)

- Crear endpoints para CRUD de documentos
- Implementar upload de archivos
- Agregar más modelos ORM
- Escribir tests más completos
- Configurar logging

---

¿Preguntas? Revisa [README.md](README.md) o [TECHNICAL_DOCS.md](TECHNICAL_DOCS.md)
