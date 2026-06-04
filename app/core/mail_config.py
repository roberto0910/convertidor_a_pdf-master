"""
Configuración de FastAPI-Mail para envío de correos electrónicos.
"""

from fastapi_mail import ConnectionConfig
from app.core.config import get_settings

settings = get_settings()


def get_mail_config() -> ConnectionConfig:
    """
    Retorna la configuración de conexión para FastAPI-Mail.
    
    Usa variables de entorno para credenciales de correo.
    Para Gmail, es necesario usar una "contraseña de aplicación" en lugar de la contraseña normal.
    """
    return ConnectionConfig(
        MAIL_USERNAME=settings.mail_username,
        MAIL_PASSWORD=settings.mail_password,
        MAIL_FROM=settings.mail_from,
        MAIL_PORT=settings.mail_port,
        MAIL_SERVER=settings.mail_server,
        MAIL_FROM_NAME=settings.mail_from_name,
        MAIL_STARTTLS=settings.mail_starttls,
        MAIL_SSL_TLS=settings.mail_ssl_tls,
        USE_CREDENTIALS=settings.mail_use_credentials,
        VALIDATE_CERTS=settings.mail_validate_certs
        # ,
        # TEMPLATE_FOLDER="app/templates/email"  # Carpeta para templates de correo
    )
