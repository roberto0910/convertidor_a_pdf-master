import asyncio
import os
from dotenv import load_dotenv
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

load_dotenv()

async def test_email_config():
    conf = ConnectionConfig(
        MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
        MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
        MAIL_FROM=os.getenv("MAIL_FROM"),
        MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
        MAIL_SERVER=os.getenv("MAIL_SERVER"),
        MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME"),
        MAIL_STARTTLS=os.getenv("MAIL_STARTTLS") == "True",
        MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS") == "True",
        USE_CREDENTIALS=os.getenv("MAIL_USE_CREDENTIALS") == "True",
        VALIDATE_CERTS=os.getenv("MAIL_VALIDATE_CERTS") == "True"
        # ,
        # TEMPLATE_FOLDER="app/templates/email"
    )

    message = MessageSchema(
        subject="Prueba de Configuración AntiGravity",
        recipients=["steven@itb.edu.ec"],
        body="Si recibes este correo, la configuración de SMTP en AntiGravity es correcta.",
        subtype=MessageType.plain
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print("✅ Correo enviado exitosamente a steven@itb.edu.ec")
    except Exception as e:
        print(f"❌ Error al enviar correo: {str(e)}")
        print("\nVerifica que hayas puesto la 'Contraseña de Aplicación' correcta en el archivo .env")

if __name__ == "__main__":
    asyncio.run(test_email_config())
