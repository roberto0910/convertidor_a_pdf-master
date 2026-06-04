"""
Modelo ORM para la tabla de Usuarios.
"""

from sqlalchemy import Column, Integer, String, Boolean, Index, DateTime
from app.db.base import Base


class User(Base):
    """
    Modelo ORM para la tabla 'users'.
    Representa un usuario del sistema de gestión documental.
    """
    
    __tablename__ = "users"
    
    # Campos de la tabla
    id = Column(
        Integer,
        primary_key=True,
        index=True,
        doc="Identificador único del usuario"
    )
    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
        doc="Correo electrónico único del usuario"
    )
    password_hash = Column(
        String(255),
        nullable=False,
        doc="Hash bcrypt de la contraseña"
    )
    role = Column(
        String(50),
        default="user",
        nullable=False,
        doc="Rol del usuario: 'admin' o 'user'"
    )
    digital_signature_path = Column(
        String(500),
        nullable=True,
        doc="Ruta a la firma digital del usuario (uso futuro)"
    )
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        doc="Indica si el usuario está activo"
    )
    password_reset_token_hash = Column(String, nullable=True, index=True)
    password_reset_token_expires_at = Column(DateTime, nullable=True)
    password_reset_token_used_at = Column(DateTime, nullable=True)
    
    # Índices adicionales
    __table_args__ = (
        Index("ix_user_email", "email"),
        Index("ix_user_role", "role"),
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"
