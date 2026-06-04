# app/services/mail_service.py

from typing import Optional, List
from fastapi_mail import FastMail, MessageSchema, MessageType

from app.core.mail_config import get_mail_config


async def send_email_background(
    recipient: str,
    subject: str,
    body: str,
    attachments: Optional[List[str]] = None,
):
    """
    Envío de correo en background (no debe lanzar exceptions).
    """
    try:
        mail_config = get_mail_config()

        message = MessageSchema(
            subject=subject,
            recipients=[recipient],
            body=body,
            subtype=MessageType.html if "<" in body else MessageType.plain,
            attachments=attachments or [],
        )

        fm = FastMail(mail_config)
        await fm.send_message(message)

        print(f"✅ Correo enviado a {recipient}")
    except Exception as e:
        print(f"❌ Error enviando correo: {str(e)}")
