# Integración Frontend - Backend API

## Descripción General

El frontend ha sido actualizado para consumir directamente tu API FastAPI de autenticación. Ahora el sistema completo incluye:

- ✅ Registro de nuevos usuarios
- ✅ Login con JWT
- ✅ Protección de rutas (solo usuarios autenticados)
- ✅ Gestión de tokens en localStorage
- ✅ Información del usuario en la interfaz
- ✅ Logout

---

## Archivos Nuevos/Modificados

### Nuevos Archivos

#### `auth-utils.js`
Librería centralizada para funciones de autenticación:
- `saveToken()` - Guardar JWT en localStorage
- `getToken()` - Obtener token guardado
- `isAuthenticated()` - Verificar si hay sesión activa
- `apiRequest()` - Hacer peticiones con token automático
- `logout()` - Cerrar sesión
- `requireAuth()` - Redirigir a login si no está autenticado

#### `register.html`
Nueva página de registro con:
- Formulario de registro (email, contraseña, confirmar contraseña)
- Validación de fortaleza de contraseña
- Términos y condiciones
- Links a login

#### `register-script.js`
Script para manejar el registro:
- Validación de todos los campos
- Indicador de fortaleza de contraseña
- Consumo de API `/api/v1/auth/register`
- Manejo de errores específicos

### Archivos Modificados

#### `login-script.js`
Cambios:
- Reemplazado `simulateLogin()` por llamada real a API `/api/v1/auth/login`
- Añadido `redirectIfAuthenticated()` para evitar acceso a login si ya está logueado
- Guardado de token JWT
- Guardado de datos del usuario

#### `index.html`
Cambios:
- Añadido ID `userAvatar` al avatar
- Añadido ID `userName` y `userRole` para mostrar datos del usuario
- Añadido botón de logout
- Importación de `auth-utils.js`

#### `script.js`
Cambios:
- Añadido `requireAuth()` al inicio para proteger la página
- Añadida función `loadUserInfo()` para mostrar datos del usuario
- Evento de logout en el botón
- Inclusión de token en las peticiones a `/convert`

#### `login.html`
Cambios:
- Link a `register.html` en lugar de `#`
- Importación de `auth-utils.js`

---

## Flujo de Autenticación

### Registro (Register)

```
1. Usuario accede a register.html
2. Llena formulario (email, contraseña, confirmar)
3. Se valida en el frontend
4. Se envía POST a /api/v1/auth/register
5. Si es exitoso:
   - Muestra mensaje de éxito
   - Redirige a login.html después de 2 segundos
```

**Endpoint:**
```
POST /api/v1/auth/register
Body: {
  "email": "usuario@itb.edu.ec",
  "password": "MiContraseña123!",
  "role": "user"
}

Response: {
  "id": 1,
  "email": "usuario@itb.edu.ec",
  "role": "user",
  "is_active": true
}
```

### Login

```
1. Usuario accede a login.html
2. Ingresa email y contraseña
3. Se valida en el frontend
4. Se envía POST a /api/v1/auth/login
5. Si es exitoso:
   - Guarda el token JWT en localStorage
   - Guarda datos del usuario
   - Muestra mensaje de éxito
   - Redirige a index.html después de 2 segundos
```

**Endpoint:**
```
POST /api/v1/auth/login
Body: {
  "email": "usuario@itb.edu.ec",
  "password": "MiContraseña123!"
}

Response: {
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

### Acceso a Páginas Protegidas

```
1. Usuario intenta acceder a index.html
2. Script verifica si hay token en localStorage
3. Si NO hay token:
   - Redirige a login.html
4. Si SÍ hay token:
   - Carga la página
   - Muestra datos del usuario (email, rol)
   - Permite usar las funcionalidades
```

### Peticiones Autenticadas

Todas las peticiones a la API incluyen automáticamente el token:

```javascript
// Ejemplo: convertir archivo
const response = await fetch(`${API_URL}/convert`, {
    method: "POST",
    body: formData,
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

### Logout

```
1. Usuario hace click en "Cerrar sesión"
2. Se ejecuta función logout()
3. Se elimina token de localStorage
4. Se elimina datos del usuario de localStorage
5. Redirige a login.html
```

---

## Configuración Necesaria

### En el Backend (FastAPI)

Asegurate que tu API está ejecutándose en `http://localhost:8000`:

```bash
# En la carpeta del backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### En el Frontend

Todos los archivos deben estar en la carpeta `frontend/`:

```
frontend/
├── index.html
├── login.html
├── register.html
├── styles.css
├── login-styles.css
├── script.js
├── login-script.js
├── register-script.js
├── auth-utils.js  ← NUEVO
└── ...
```

### CORS (Importante)

Tu API FastAPI ya debe tener CORS habilitado. Verifica en `app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # Ej: ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Si necesitas permitir `http://localhost` desde el frontend, actualiza `.env`:

```
ALLOWED_ORIGINS=http://localhost,http://localhost:8000,http://127.0.0.1:8000
```

---

## Variables Almacenadas en localStorage

El sistema usa localStorage para guardar:

```javascript
// Token JWT
localStorage.getItem('eva-access-token')

// Datos del usuario (opcional)
localStorage.getItem('eva-user-data')

// Credenciales guardadas (si marca "Recuérdame")
localStorage.getItem('eva-credentials')
```

---

## Estructura de Respuestas de API

### Login Exitoso (200)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Registro Exitoso (201)
```json
{
  "id": 1,
  "email": "usuario@itb.edu.ec",
  "role": "user",
  "is_active": true
}
```

### Error - Usuario No Encontrado (404)
```json
{
  "detail": "User not found or invalid credentials"
}
```

### Error - Email Duplicado (400)
```json
{
  "detail": "User with this email already exists"
}
```

### Error - Contraseña Débil (400)
```json
{
  "detail": "Password must be at least 8 characters"
}
```

---

## Pruebas Manuales

### 1. Registrar un usuario

```bash
# Desde PowerShell o Terminal
$body = @{
    email = "nuevo@itb.edu.ec"
    password = "Password123!"
    role = "user"
} | ConvertTo-Json

curl -X POST "http://localhost:8000/api/v1/auth/register" `
  -H "Content-Type: application/json" `
  -d $body
```

### 2. Login

```bash
$body = @{
    email = "nuevo@itb.edu.ec"
    password = "Password123!"
} | ConvertTo-Json

curl -X POST "http://localhost:8000/api/v1/auth/login" `
  -H "Content-Type: application/json" `
  -d $body
```

### 3. Acceder a página protegida (desde Frontend)

El frontend automáticamente:
1. Verifica si hay token
2. Si no hay → redirige a login
3. Si hay → carga la página

---

## Pasos para Usar el Sistema

### Primera vez

1. **Abre el frontend en tu navegador:**
   ```
   Abre el archivo index.html en tu navegador
   O sirve la carpeta frontend con un servidor local
   ```

2. **Te redirigirá a login.html** porque no hay sesión

3. **Click en "Crear cuenta"**
   - Ingresa email, contraseña
   - Acepta términos
   - Haz click en "Crear Cuenta"

4. **Serás redirigido a login.html**
   - Ingresa tus credenciales
   - Haz click en "Iniciar Sesión"

5. **Ya estás dentro en index.html**
   - Puedes ver tu email en la esquina superior derecha
   - Puedes usar la funcionalidad de conversión
   - Puedes hacer logout

### Siguientes veces

1. **Abre index.html**
2. **Si ya hay token válido:**
   - Se carga la página directamente
3. **Si no hay token:**
   - Te redirige a login.html

---

## Solución de Problemas

### Error: "API no responde"

**Causa:** El backend no está corriendo

**Solución:**
```bash
# Ve a la carpeta del backend y ejecuta:
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Error: "CORS error"

**Causa:** El CORS no está habilitado correctamente

**Solución:**
1. Abre tu API en `http://localhost:8000/docs`
2. Verifica que las rutas estén disponibles
3. Actualiza ALLOWED_ORIGINS en `.env` del backend

### Error: "Token inválido"

**Causa:** El token expiró (después de 30 minutos por defecto)

**Solución:**
1. Abre la consola (F12)
2. Limpia localStorage:
   ```javascript
   localStorage.clear()
   ```
3. Recarga la página
4. Vuelve a hacer login

### Error: "Usuario o contraseña incorrectos"

**Causa:** Las credenciales no coinciden con las registradas

**Solución:**
1. Verifica que escribiste correctamente el email
2. Verifica que la contraseña sea la correcta
3. Si olvidaste la contraseña, crea una nueva cuenta

---

## Arquitectura de Seguridad

- **Contraseñas:** Almacenadas con bcrypt (hash seguro) en la BD
- **Tokens:** JWT con HS256, válidos por 30 minutos
- **CORS:** Configurado para solo aceptar peticiones del frontend
- **Headers:** Authorization con Bearer token
- **Storage:** Tokens en localStorage (accesible desde JS)

---

## Próximos Pasos

1. **Servir el frontend:** Usa un servidor web (nginx, Apache, Node.js, etc.)
2. **Variables de entorno:** Usa variable en lugar de `http://localhost:8000`
3. **Diseño del registro:** Personaliza colores, textos, etc.
4. **Validaciones adicionales:** Añade validaciones más estrictas
5. **Recuperación de contraseña:** Implementa endpoint de reset

---

**Última actualización:** 16 de diciembre de 2025  
**Versión:** 2.0.0 (Integración completada)
