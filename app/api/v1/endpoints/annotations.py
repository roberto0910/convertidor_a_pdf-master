"""
Endpoints para anotaciones en PDFs y envío de correos electrónicos.
"""

import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from fastapi_mail import FastMail, MessageSchema, MessageType
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.api import deps
from app.models import User, Document, Version
from app.schemas.annotation import (
    AnnotateRequest,
    AnnotateResponse,
    SendEmailRequest,
    SendEmailResponse
)
from app.schemas.document import VersionResponse
from app.services.pdf_annotation import PDFAnnotationService
from app.core.config import get_settings
from app.core.mail_config import get_mail_config

router = APIRouter(
    prefix="/api/v1/annotations",
    tags=["annotations"]
)

settings = get_settings()
UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/annotate", response_model=AnnotateResponse)
async def annotate_pdf(
    request: AnnotateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Agrega anotaciones a un PDF existente y crea una nueva versión.
    
    - **file_id**: ID de la versión del documento a anotar
    - **annotations**: Lista de anotaciones con coordenadas (x, y), texto y tipo
    
    Permisos requeridos: Editor o Owner
    """
    # 1. Buscar la versión del documento
    stmt = select(Version).where(Version.id == request.file_id)
    result = await db.execute(stmt)
    version = result.scalar_one_or_none()
    
    if not version:
        raise HTTPException(
            status_code=404,
            detail="Versión del documento no encontrada"
        )
    
    # 2. Verificar permisos (editor o owner)
    await deps.verify_document_access(
        version.document_id,
        db,
        current_user,
        "editor"
    )
    
    # 3. Validar que el archivo existe
    source_path = Path(version.file_path)
    if not source_path.exists():
        raise HTTPException(
            status_code=404,
            detail="El archivo físico no existe en el servidor"
        )
    
    # 4. Validar que es un PDF
    is_valid, message = PDFAnnotationService.validate_pdf(source_path)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"PDF inválido: {message}"
        )
    
    # 5. Crear archivo de salida para el PDF anotado
    output_filename = f"{uuid.uuid4()}.pdf"
    output_path = UPLOAD_DIR / output_filename
    
    try:
        # 6. Procesar anotaciones
        annotations_list = [annot.model_dump() for annot in request.annotations]
        
        success = PDFAnnotationService.add_annotations(
            input_pdf_path=source_path,
            output_pdf_path=output_path,
            annotations=annotations_list
        )
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Error al procesar las anotaciones"
            )
        
        # 7. Crear nueva versión en la base de datos
        # Obtener número de versión actual
        stmt_doc = select(Document).where(Document.id == version.document_id)
        result_doc = await db.execute(stmt_doc)
        document = result_doc.scalar_one()
        
        # Calcular nuevo número de versión
        stmt_last = (
            select(Version)
            .where(Version.document_id == version.document_id)
            .order_by(Version.created_at.desc())
            .limit(1)
        )
        result_last = await db.execute(stmt_last)
        last_version = result_last.scalar_one_or_none()
        
        new_version_number = "v1.0"
        if last_version:
            try:
                v_num = last_version.version_number.replace('v', '').split('-')[0]
                parts = v_num.split('.')
                major = int(parts[0])
                minor = int(parts[1]) if len(parts) > 1 else 0
                new_version_number = f"v{major}.{minor + 1}-annotated"
            except:
                new_version_number = "v1.1-annotated"
        
        # Obtener tamaño del archivo
        file_size = output_path.stat().st_size
        
        # Crear nueva versión
        new_version = Version(
            document_id=version.document_id,
            version_number=new_version_number,
            file_path=str(output_path),
            file_size=file_size,
            mime_type="application/pdf",
            is_latest=True
        )
        
        # Marcar versiones anteriores como no actuales
        from sqlalchemy import update
        await db.execute(
            update(Version)
            .where(Version.document_id == version.document_id)
            .values(is_latest=False)
        )
        
        db.add(new_version)
        await db.commit()
        await db.refresh(new_version)
        
        return AnnotateResponse(
            success=True,
            message=f"PDF anotado exitosamente. {len(request.annotations)} anotación(es) agregada(s).",
            annotated_version_id=new_version.id,
            filename=document.name
        )
        
    except HTTPException:
        # Re-lanzar excepciones HTTP
        if output_path.exists():
            output_path.unlink()
        raise
    except Exception as e:
        # Limpiar en caso de error
        if output_path.exists():
            output_path.unlink()
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar anotaciones: {str(e)}"
        )


async def send_email_background(
    recipient: str,
    subject: str,
    body: str,
    attachment_path: Optional[Path] = None,
    attachment_name: Optional[str] = None
):
    """
    Tarea en background para enviar correo.
    No debe lanzar excepciones ya que se ejecuta en background.
    """
    try:
        mail_config = get_mail_config()
        
        # Preparar mensaje
        message = MessageSchema(
            subject=subject,
            recipients=[recipient],
            body=body,
            subtype=MessageType.html if "<" in body else MessageType.plain,
            # NOTA: En FastAPI-Mail >= 1.4.0, los adjuntos deben ir en el MessageSchema.
            # Se convierten a str porque Pydantic espera cadenas de texto para las rutas.
            attachments=[str(attachment_path)] if attachment_path and attachment_path.exists() else []
        )
        
        # Enviar correo
        fm = FastMail(mail_config)
        await fm.send_message(message)
        
        print(f"✅ Correo enviado exitosamente a {recipient}")
        
    except Exception as e:
        print(f"❌ Error al enviar correo: {str(e)}")


@router.post("/send-email", response_model=SendEmailResponse)
async def send_email_with_pdf(
    request: SendEmailRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Envía un correo electrónico con un PDF adjunto.
    
    - **recipient**: Correo electrónico del destinatario
    - **subject**: Asunto del correo
    - **body**: Cuerpo del mensaje (puede incluir HTML)
    - **file_version_id**: ID de la versión del archivo a adjuntar
    
    El envío se realiza en background para no bloquear la respuesta.
    """
    # 1. Validar configuración de correo
    if not settings.mail_username or not settings.mail_password:
        raise HTTPException(
            status_code=500,
            detail="Configuración de correo no disponible. Configure las variables MAIL_USERNAME y MAIL_PASSWORD."
        )
    
    # 2. Buscar la versión del documento
    stmt = select(Version).where(Version.id == request.file_version_id)
    result = await db.execute(stmt)
    version = result.scalar_one_or_none()
    
    if not version:
        raise HTTPException(
            status_code=404,
            detail="Versión del documento no encontrada"
        )
    
    # 3. Verificar permisos (al menos viewer)
    await deps.verify_document_access(
        version.document_id,
        db,
        current_user,
        "viewer"
    )
    
    # 4. Validar que el archivo existe
    file_path = Path(version.file_path)
    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="El archivo físico no existe en el servidor"
        )
    
    # 5. Obtener documento para el nombre
    stmt_doc = select(Document).where(Document.id == version.document_id)
    result_doc = await db.execute(stmt_doc)
    document = result_doc.scalar_one()
    
    # 6. Preparar cuerpo del correo si no se proporciona
    if not request.body:
        request.body = f"""
        <html>
            <body>
                <p>Hola,</p>
                <p>Adjunto encontrarás el documento <strong>{document.name}</strong>.</p>
                <p>Saludos,<br>
                {settings.mail_from_name}</p>
            </body>
        </html>
        """
    
    # 7. Actualizar flag de compartido externamente
    document.shared_externally = True
    db.add(document)
    await db.commit()
    
    # 8. Agregar tarea en background
    background_tasks.add_task(
        send_email_background,
        recipient=request.recipient,
        subject=request.subject,
        body=request.body,
        attachment_path=file_path,
        attachment_name=document.name
    )
    
    return SendEmailResponse(
        success=True,
        message=f"El correo será enviado a {request.recipient} en breve."
    )
