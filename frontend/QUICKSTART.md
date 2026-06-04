# 🚀 Guía Rápida - Iniciar Sistema Completo

## Paso 1: Iniciar el Backend API

**En PowerShell (carpeta del backend):**

```powershell
cd "F:\03 - Python\02 - FAST API\03 - Proyecto de titulacion\v1"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Espera a ver:**
```
Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

✅ API está lista en: `http://localhost:8000`

---

## Paso 2: Abrir Frontend

### Opción A: Abrir archivo directamente
1. Navega a: `frontend/` carpeta
2. Abre `login.html` en tu navegador
3. **Verás la página de login automáticamente** (porque no hay sesión)

### Opción B: Servir con servidor local (Recomendado)

**Con Python (carpeta frontend):**
```powershell
cd "F:\03 - Python\02 - FAST API\03 - Proyecto de titulacion\v1\frontend"
python -m http.server 8001
```

Abre en navegador: `http://localhost:8001/login.html`

**Con Node.js (si tienes Node):**
```bash
npx http-server -p 8001
```

---

## Paso 3: Registrarse

En la página de login:
1. Click en **"Crear cuenta"**
2. Completa el formulario:
   - Email: `estudiante@ejemplo.edu.ec`
   - Contraseña: `Password123!` (mínimo 8 caracteres)
   - Confirmar: repite la contraseña
3. ✅ Acepta términos y condiciones
4. Click **"Crear Cuenta"**

**Resultado esperado:**
```
✓ Mensaje de éxito
✓ Redirige a login.html automáticamente después de 2 segundos
```

---

## Paso 4: Login

En la página de login:
1. Email: `estudiante@ejemplo.edu.ec`
2. Contraseña: `Password123!`
3. ✓ Opcional: marca "Recuérdame" para guardar credenciales
4. Click **"Iniciar Sesión"**

**Resultado esperado:**
```
✓ Mensaje: "¡Bienvenido!"
✓ Redirige a index.html automáticamente
✓ Ver tu email en esquina superior derecha
```

---

## Paso 5: Usar la Aplicación

En `index.html`:
1. **Información del usuario** en esquina superior derecha:
   - Avatar con iniciales de tu email
   - Tu email
   - Tu rol (admin o user)

2. **Subir archivo Word**:
   - Click "Seleccionar archivo" o arrastra .docx
   - Click "Convertir a PDF"
   - Descarga automática del PDF

3. **Logout**:
   - Click en tu email
   - Click "Cerrar sesión"
   - Volverá a login.html

---

## ✅ Checklist de Verificación

```
[ ] Backend API corriendo en http://localhost:8000
[ ] Frontend accesible (archivo o servidor local)
[ ] Puedo registrarme con nuevo email
[ ] Puedo iniciar sesión con mis credenciales
[ ] Veo mi email en la esquina superior derecha
[ ] Puedo subir y convertir archivos Word a PDF
[ ] Puedo cerrar sesión
[ ] Si intento acceder a index.html sin token → redirige a login
```

---

## 🔍 Solución Rápida de Errores

| Error | Causa | Solución |
|-------|-------|----------|
| "API no responde" | Backend no está corriendo | Ejecuta `uvicorn app.main:app --reload` |
| "CORS error" | Frontend en diferente puerto | Verifica `ALLOWED_ORIGINS` en `.env` |
| "Usuario no encontrado" | Credenciales incorrectas | Verifica email y contraseña |
| "Email ya existe" | Ya registraste ese email | Usa otro email o haz login |
| "Página en blanco" | Falta token pero debería haber | Limpia localStorage (F12 → Application) |

---

## 📍 Puertos Usados

| Servicio | Puerto | URL |
|----------|--------|-----|
| Backend (Uvicorn) | 8000 | http://localhost:8000 |
| Frontend (http.server) | 8001 | http://localhost:8001 |
| API Docs | 8000 | http://localhost:8000/docs |

---

## 🔐 Datos de Prueba

Después de registrarte, puedes crear múltiples cuentas:

```
Email: estudiante1@itb.edu.ec
Password: Segura123!

Email: estudiante2@itb.edu.ec
Password: MiPassword456!
```

Cada email puede tener su propia sesión.

---

## 💾 Archivos Importantes

```
Backend:
├── app/main.py                    # API principal
├── app/api/v1/endpoints/auth.py   # Endpoints de autenticación
├── app/core/security.py           # Manejo de JWT y bcrypt
└── requirements.txt               # Dependencias

Frontend:
├── index.html                     # Página principal (protegida)
├── login.html                     # Página de login
├── register.html                  # Página de registro (NUEVA)
├── auth-utils.js                  # Utilidades de autenticación (NUEVA)
├── login-script.js                # Script de login (MODIFICADO)
├── register-script.js             # Script de registro (NUEVA)
├── script.js                       # Script principal (MODIFICADO)
└── styles.css                     # Estilos compartidos
```

---

## 🎯 Flujo Visual

```
┌──────────┐
│ Usuario  │
└────┬─────┘
     │
     ├─→ [Primer acceso]
     │   └→ login.html (sin token)
     │       └→ "Crear cuenta"
     │           └→ register.html
     │               └→ Completa formulario
     │                   └→ POST /register
     │                       └→ Éxito → login.html
     │
     ├─→ [Iniciar sesión]
     │   └→ login.html
     │       └→ Email + Contraseña
     │           └→ POST /login
     │               └→ JWT guardado en localStorage
     │                   └→ index.html
     │
     ├─→ [Usar aplicación]
     │   └→ index.html (protegida)
     │       ├→ Convertir Word → PDF
     │       ├→ Ver mi perfil
     │       └→ Cerrar sesión
     │           └→ localStorage limpio
     │               └→ login.html
     │
     └─→ [Cerrar navegador]
         └→ Token persiste en localStorage
             └→ Próximo acceso → directo a index.html
```

---

## 📞 Contacto / Dudas

Si algo no funciona:

1. **Abre la consola** (F12 → Console)
2. **Mira los errores** rojo
3. **Revisa** `INTEGRATION.md` para soluciones
4. **Verifica** que API está corriendo en 8000

---

**¡Tu sistema de autenticación está listo! 🎉**

Puedes empezar a:
- ✅ Registrar usuarios
- ✅ Hacer login con JWT
- ✅ Proteger rutas con tokens
- ✅ Consumir tu API desde el frontend

**Siguiente:** Revisa `INTEGRATION.md` para documentación completa.

Última actualización: 16 de diciembre de 2025
