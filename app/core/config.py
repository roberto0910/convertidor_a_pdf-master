"""
Configuración de la aplicación usando pydantic-settings.
Variables de entorno y configuraciones globales.
"""

from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """
    Configuración global de la aplicación.
    Las variables se pueden sobrescribir mediante variables de entorno.
    """
    
    # Información de la aplicación
    app_name: str = "Sistema de Gestión Documental"
    app_version: str = "0.1.0"
    debug: bool = False
    
    # Base de datos
    database_url: str = "sqlite+aiosqlite:///./gestion_documental.db"
    db_echo: bool = False  # Log de sentencias SQL (útil en debug)
    
    # Seguridad - JWT
    secret_key: str = "tu-clave-secreta-super-segura-cambiar-en-produccion-32-caracteres-minimo"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30 # 30 minutos
    
    frontend_base_url: str = "http://localhost:8000"
    password_reset_token_expire_minutes: int = 30
    
    # CORS (para frontend)
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
    ]
    
    # Directorio de subidas
    upload_dir: str = "uploads"
    
    # Configuración de correo electrónico (FastAPI-Mail)
    mail_username: str = ""
    mail_password: str = ""
    mail_from: str = ""
    mail_port: int = 587
    mail_server: str = "smtp.gmail.com"
    mail_from_name: str = "Sistema AntiGravity"
    mail_starttls: bool = True
    mail_ssl_tls: bool = False
    mail_use_credentials: bool = True
    mail_validate_certs: bool = True
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False
    }


@lru_cache()
def get_settings() -> Settings:
    """
    Retorna la instancia cacheada de Settings.
    Útil para evitar cargar múltiples veces las variables de entorno.
    """
    return Settings()
