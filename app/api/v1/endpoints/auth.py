"""
Endpoints de autenticación (login y registro).
"""

from datetime import timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserLogin, RoleUpdate, UserUpdate, UserStatusUpdate
from app.schemas.token import Token
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import get_settings
from app.api import deps

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["auth"],
    responses={404: {"description": "No encontrado"}}
)

settings = get_settings()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """
    Endpoint para registrar un nuevo usuario.
    
    Parámetros:
    - **email**: Correo electrónico único
    - **password**: Contraseña (mínimo 8 caracteres)
    - **role**: Rol del usuario ('admin' o 'user', por defecto 'user')
    
    Retorna:
    - Datos del usuario creado (sin contraseña)
    
    Excepciones:
    - 400: Email ya existe
    """
    
    # Verificar si el usuario ya existe
    stmt = select(User).where(User.email == user_data.email)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear nuevo usuario con password hasheado
    hashed_password = hash_password(user_data.password)
    
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        role=user_data.role,
        is_active=True
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return UserResponse.from_orm(new_user)


@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
) -> Token:
    """
    Endpoint para login y obtención de JWT access token.
    Utiliza OAuth2PasswordRequestForm estándar.
    
    Parámetros:
    - **username**: Email del usuario (OAuth2PasswordRequestForm usa 'username')
    - **password**: Contraseña
    
    Retorna:
    - Token JWT en formato {"access_token": "...", "token_type": "bearer"}
    
    Excepciones:
    - 401: Credenciales inválidas
    """
    
    # Buscar usuario por email (form_data.username contiene el email)
    stmt = select(User).where(User.email == form_data.username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    # Validar usuario y contraseña
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    # Crear access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        subject=user.email,
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin,
    db: AsyncSession = Depends(get_db)
) -> Token:
    """
    Endpoint alternativo de login con JSON en lugar de form-data.
    Acepta email y password en JSON.
    
    Parámetros (JSON):
    - **email**: Email del usuario
    - **password**: Contraseña
    
    Retorna:
    - Token JWT en formato {"access_token": "...", "token_type": "bearer"}
    
    Excepciones:
    - 401: Credenciales inválidas
    """
    
    # Buscar usuario por email
    stmt = select(User).where(User.email == user_data.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    # Validar usuario y contraseña
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    # Crear access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        subject=user.email,
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(deps.get_current_user)):
    """
    Obtiene la información del usuario actual.
    """
    return current_user


@router.post("/create-admin", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_admin(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(deps.get_current_admin),
) -> UserResponse:
    """
    Crear un usuario con rol 'admin'.
    Requiere autenticación de un admin existente.
    """

    # Verificar si el usuario ya existe
    stmt = select(User).where(User.email == user_data.email)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )

    hashed_password = hash_password(user_data.password)

    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        role="admin",
        is_active=True
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return UserResponse.from_orm(new_user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(deps.get_current_admin),
) -> Response:
    """
    Elimina un usuario por su ID. Requiere permisos de administrador.
    Devuelve 204 No Content en caso de éxito.
    """

    from app.models.document import Document, Permission, Version
    from sqlalchemy import delete

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    # 1. Eliminar permisos del usuario (como invitado)
    await db.execute(delete(Permission).where(Permission.user_id == user_id))

    # 2. Buscar documentos del usuario para limpiarlos
    docs_stmt = select(Document.id).where(Document.user_id == user_id)
    docs_result = await db.execute(docs_stmt)
    doc_ids = docs_result.scalars().all()

    if doc_ids:
        # Eliminar versiones de los documentos del usuario
        await db.execute(delete(Version).where(Version.document_id.in_(doc_ids)))
        # Eliminar permisos asociados a esos documentos
        await db.execute(delete(Permission).where(Permission.document_id.in_(doc_ids)))
        # Eliminar los documentos
        await db.execute(delete(Document).where(Document.id.in_(doc_ids)))

    # Finalmente, eliminar el usuario
    await db.delete(user)
    await db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(deps.get_current_admin),
) -> List[UserResponse]:
    """
    Lista todos los usuarios. Requiere permisos de administrador.
    """
    stmt = select(User)
    result = await db.execute(stmt)
    users = result.scalars().all()

    return [UserResponse.from_orm(u) for u in users]



@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def change_user_role(
    user_id: int,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(deps.get_current_admin),
) -> UserResponse:
    """
    Cambia el rol de un usuario (`admin` o `user`). Requiere admin autenticado.
    """
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    # Validar y aplicar cambio
    new_role = payload.role
    if new_role not in ("admin", "user"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rol inválido")

    user.role = new_role
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserResponse.from_orm(user)


@router.patch("/users/{user_id}/status", response_model=UserResponse)
async def change_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(deps.get_current_admin),
) -> UserResponse:
    """
    Cambia el estado de un usuario (activo/inactivo). Requiere admin autenticado.
    No permite desactivar al usuario actual.
    """
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    # Protección: No permitir desactivar al usuario actual
    if payload.is_active is False and user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No puedes desactivar tu propia cuenta. Debes mantener al menos un administrador activo."
        )

    # Aplicar cambio de estado
    user.is_active = payload.is_active
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserResponse.from_orm(user)


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(deps.get_current_admin),
) -> UserResponse:
    """
    Actualiza rol y/o estado de un usuario. Requiere admin autenticado.
    Acepta uno o ambos parámetros: role, is_active
    """
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    # Protección: No permitir desactivar al usuario actual
    if payload.is_active is False and user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No puedes desactivar tu propia cuenta. Debes mantener al menos un administrador activo."
        )

    # Actualizar rol si se proporciona
    if payload.role:
        if payload.role not in ("admin", "user"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rol inválido")
        user.role = payload.role

    # Actualizar estado si se proporciona
    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserResponse.from_orm(user)


from datetime import datetime, timedelta
from fastapi import BackgroundTasks

from app.schemas.password_reset import (
    PasswordRecoveryRequest,
    PasswordRecoveryResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
)

from app.core.security import (
    generate_reset_token,
    hash_reset_token,
    hash_password,
)

from app.services.mail_service import send_email_background

@router.post("/password-recovery", response_model=PasswordRecoveryResponse)
async def password_recovery(
    request: PasswordRecoveryRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> PasswordRecoveryResponse:
    """
    Solicita restablecimiento. Respuesta SIEMPRE genérica (no revela si el email existe).
    """
    # Si no hay config de correo, para tu caso mejor lanzar 500 (o devolver genérico)
    if not settings.mail_username or not settings.mail_password:
        raise HTTPException(
            status_code=500,
            detail="Configuración de correo no disponible. Configure MAIL_USERNAME y MAIL_PASSWORD."
        )

    # Buscar usuario por email (pero no revelar resultado)
    stmt = select(User).where(User.email == request.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    # Respuesta genérica (siempre)
    generic_response = PasswordRecoveryResponse(
        success=True,
        message="Si el correo existe, enviaremos un enlace para restablecer tu contraseña."
    )

    if not user:
        return generic_response

    if not user.is_active:
        # Igual devolvemos genérico para no filtrar información
        return generic_response

    # Generar token + guardar hash + expirar
    token = generate_reset_token()
    token_hash = hash_reset_token(token)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.password_reset_token_expire_minutes)

    user.password_reset_token_hash = token_hash
    user.password_reset_token_expires_at = expires_at
    user.password_reset_token_used_at = None

    db.add(user)
    await db.commit()

    # Link al frontend
    reset_link = f"{settings.frontend_base_url.rstrip('/')}/reset-password.html?token={token}"

    subject = "Restablecer contraseña"
    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>Restablecer contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>
          Haz clic aquí para crear una nueva contraseña:
          <br/>
          <a href="{reset_link}" style="display:inline-block;padding:10px 14px;text-decoration:none;border-radius:6px;border:1px solid #333;">
            Restablecer contraseña
          </a>
        </p>
        <p>Este enlace expira en <strong>{settings.password_reset_token_expire_minutes} minutos</strong>.</p>
        <p>Si tú no hiciste esta solicitud, puedes ignorar este mensaje.</p>
      </body>
    </html>
    """

    background_tasks.add_task(
        send_email_background,
        recipient=user.email,
        subject=subject,
        body=body,
    )

    return generic_response


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> ResetPasswordResponse:
    """
    Restablece la contraseña usando el token.
    """
    token_hash = hash_reset_token(request.token)
    now = datetime.utcnow()

    # Buscar usuario con token vigente y no usado
    stmt = select(User).where(User.password_reset_token_hash == token_hash)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if (
        not user
        or not user.password_reset_token_expires_at
        or user.password_reset_token_expires_at < now
        or user.password_reset_token_used_at is not None
    ):
        raise HTTPException(
            status_code=400,
            detail="Token inválido o expirado."
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    # Actualizar password
    user.password_hash = hash_password(request.new_password)

    # Invalidar token (un solo uso)
    user.password_reset_token_used_at = now
    user.password_reset_token_hash = None
    user.password_reset_token_expires_at = None

    db.add(user)
    await db.commit()

    return ResetPasswordResponse(
        success=True,
        message="Contraseña actualizada correctamente."
    )
