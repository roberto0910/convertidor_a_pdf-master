"""
Funciones de seguridad: hash de contraseñas y manejo de JWT.
Actualizado para compatibilidad con Argon2 y Python 3.13.
"""

from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt

from app.core.config import get_settings

# --- CORRECCIÓN AQUÍ ---
# Cambiamos "bcrypt" por "argon2" para evitar el ValueError en Python 3.13
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

settings = get_settings()


def hash_password(password: str) -> str:
    """
    Hashea una contraseña usando Argon2.
    
    Args:
        password: Contraseña en texto plano
        
    Returns:
        Hash de la contraseña
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica una contraseña en texto plano contra su hash Argon2.
    
    Args:
        plain_password: Contraseña en texto plano
        hashed_password: Hash de la contraseña guardado en DB
        
    Returns:
        True si la contraseña es correcta, False en caso contrario
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Crea un JWT access token.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    
    to_encode = {"exp": expire, "sub": str(subject)} # Aseguramos que sea string
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[str]:
    """
    Decodifica y valida un JWT token.
    """
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None
    
import hashlib
import secrets

def generate_reset_token() -> str:
    """
    Token fuerte y URL-safe para restablecimiento.
    """
    return secrets.token_urlsafe(32)


def hash_reset_token(token: str) -> str:
    """
    Guarda en BD SOLO el hash del token (no el token en texto plano).
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()