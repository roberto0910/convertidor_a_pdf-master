# 🆘 AYUDA RÁPIDA

## Preguntas Frecuentes

### ❓ ¿Por dónde empiezo?

**Respuesta**: Abre [QUICKSTART.md](QUICKSTART.md) - está diseñado para 5 minutos.

---

### ❓ ¿Cuál es el flujo de autenticación?

**Respuesta**: Hay 3 pasos:
1. **Registro**: `POST /api/v1/auth/register`
2. **Login**: `POST /api/v1/auth/login` → Obtienes JWT
3. **Usar Token**: `Authorization: Bearer <token>` en otros requests

---

### ❓ ¿Cómo cambio la contraseña secreta?

**Respuesta**:
1. Abre `.env`
2. Genera una nueva: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
3. Cambia `SECRET_KEY` en `.env`

---

### ❓ ¿Cómo creo un usuario admin?

**Respuesta**:
```bash
python manage.py create-admin admin@example.com password123
```

---

### ❓ ¿Dónde veo la documentación de la API?

**Respuesta**:
- Ejecuta: `uvicorn app.main:app --reload`
- Abre: `http://localhost:8000/docs`

---

### ❓ ¿Cómo ejecuto los tests?

**Respuesta**:
```bash
pytest -v
```

---

### ❓ ¿Qué significa "Port 8000 already in use"?

**Respuesta**: Otro programa usa ese puerto. Usa otro:
```bash
uvicorn app.main:app --reload --port 8001
```

---

### ❓ ¿Dónde está la base de datos?

**Respuesta**: Archivo `gestion_documental.db` en la raíz del proyecto.

---

### ❓ ¿Cómo borro todo y comienzo de cero?

**Respuesta**:
```bash
# Eliminar BD actual
del gestion_documental.db

# Inicializar nuevamente
python manage.py init
```

---

### ❓ ¿Puedo usar MySQL o PostgreSQL en lugar de SQLite?

**Respuesta**: Sí. Edita `DATABASE_URL` en `.env`:
```
# MySQL
DATABASE_URL=mysql+aiomysql://user:pass@localhost/db

# PostgreSQL
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/db
```

---

### ❓ ¿Dónde agrego nuevos endpoints?

**Respuesta**: Crea archivos en `app/api/v1/endpoints/`:

```python
# app/api/v1/endpoints/documentos.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/documentos")

@router.get("/")
async def listar_documentos():
    return {"documentos": []}
```

Luego incluye en `app/api/v1/endpoints/__init__.py`:
```python
from app.api.v1.endpoints.documentos import router as docs_router
__all__ = ["docs_router"]
```

---

### ❓ ¿El proyecto está listo para producción?

**Respuesta**: Semana 1 está lista. Para producción debes:
- [ ] Cambiar `SECRET_KEY`
- [ ] Cambiar `DEBUG=False`
- [ ] Usar HTTPS
- [ ] Configurar BD en servidor
- [ ] Tests exhaustivos
- [ ] CORS restringido
- [ ] Logging configurado

---

### ❓ ¿Qué significa "Token inválido o expirado"?

**Respuesta**: El token tiene 30 minutos de vida. Haz login nuevamente:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@example.com", "password": "password123"}'
```

---

### ❓ ¿Cómo veo todos los archivos creados?

**Respuesta**: Abre [STRUCTURE.md](STRUCTURE.md)

---

### ❓ ¿Hay más documentación?

**Respuesta**: Sí, tenemos 12 documentos:
- [INDEX.md](INDEX.md) - Índice completo
- [README.md](README.md) - Guía principal
- [QUICKSTART.md](QUICKSTART.md) - 5 minutos
- [TECHNICAL_DOCS.md](TECHNICAL_DOCS.md) - Detalles técnicos
- [STRUCTURE.md](STRUCTURE.md) - Árbol del proyecto
- [ARCHITECTURE.md](ARCHITECTURE.md) - Diagramas
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Checklist
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Errores
- [SUMMARY.md](SUMMARY.md) - Resumen
- [VERSION.md](VERSION.md) - Historial
- [START.txt](START.txt) - Visual
- [HELP.md](HELP.md) - Este archivo

---

## Atajos Útiles

### Iniciar Rápido
```bash
# 1. Instalar
pip install -r requirements.txt

# 2. Ejecutar
uvicorn app.main:app --reload

# 3. Visitar
http://localhost:8000/docs
```

### Crear Usuarios
```bash
# Admin
python manage.py create-admin admin@example.com password123

# Usuario normal
python manage.py create-user user@example.com password123

# Listar
python manage.py list-users
```

### Testing
```bash
# Todos los tests
pytest -v

# Test específico
pytest tests/test_auth.py::test_register_user -v

# Con coverage
pytest --cov=app tests/
```

### Scripts de Testing
```bash
# Windows
powershell -ExecutionPolicy Bypass -File api-test.ps1

# Linux/Mac
bash api-test.sh
```

---

## Conceptos Clave en 30 Segundos

### JWT (Token)
```
Cliente → Login → Servidor genera JWT → Cliente guarda
Cliente → Request + JWT → Servidor valida → Acceso
```

### Async/Await
```python
# Requiere async
async def endpoint():
    result = await db.query()  # No bloquea
    return result
```

### Pydantic (Validación)
```python
# Automático
class User(BaseModel):
    email: EmailStr  # Valida email
    password: str    # Min 8 chars

# FastAPI lo hace automáticamente
@app.post("/")
async def create(user: User):  # Valida entrada
    return user  # Valida salida
```

### ORM (SQLAlchemy)
```python
# Python objects ↔ BD
user = User(email="test@example.com", ...)
db.add(user)
await db.commit()
```

---

## Pasos de Troubleshooting

1. ✅ Verifica que el entorno virtual está activado
2. ✅ Ejecuta `pip install -r requirements.txt`
3. ✅ Revisa `.env` está configurado
4. ✅ Ejecuta `uvicorn app.main:app --reload`
5. ✅ Abre http://localhost:8000/docs
6. ✅ Si aún no funciona, revisa [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## Recursos Externos

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
- [Pydantic Docs](https://docs.pydantic.dev/)
- [JWT Info](https://jwt.io/)

---

## Contacto/Soporte

Para problemas específicos:
1. Revisa [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Busca el error en los documentos
3. Revisa los comentarios en el código
4. Consulta la documentación oficial

---

**¡Proyecto completo y listo! 🚀**

**¿Necesitas ayuda?** → Abre [INDEX.md](INDEX.md)
