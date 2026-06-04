"""
Modelos ORM para Documentos y Versiones.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship

from app.db.base import Base


class Document(Base):
    """
    Representa un documento base en el sistema.
    Un documento puede tener múltiples versiones.
    """
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shared_externally = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    user = relationship("User", backref="documents")
    versions = relationship("Version", back_populates="document", cascade="all, delete-orphan")
    permissions = relationship("Permission", back_populates="document", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Document(id={self.id}, name='{self.name}', user_id={self.user_id})>"


class Version(Base):
    """
    Representa una versión específica de un documento.
    """
    __tablename__ = "versions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    version_number = Column(String(20), nullable=False) # e.g., "v1.0"
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=True)
    is_latest = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    document = relationship("Document", back_populates="versions")

    def __repr__(self):
        return f"<Version(id={self.id}, doc_id={self.document_id}, version='{self.version_number}')>"


class Permission(Base):
    """
    Tabla intermedia para gestionar los permisos de los usuarios sobre los documentos.
    Niveles de permiso: 'owner', 'editor', 'viewer'.
    """
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    permission_level = Column(String(50), nullable=False) # 'owner', 'editor', 'viewer'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relaciones
    user = relationship("User", backref="document_permissions")
    document = relationship("Document", back_populates="permissions")

    def __repr__(self):
        return f"<Permission(id={self.id}, user_id={self.user_id}, doc_id={self.document_id}, level='{self.permission_level}')>"
