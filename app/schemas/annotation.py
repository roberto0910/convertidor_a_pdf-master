"""
Schemas para anotaciones en PDFs y envío de correos.
"""

from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class AnnotationItem(BaseModel):
    """Representa una anotación individual en el PDF."""
    x: float = Field(..., description="Coordenada X en el PDF")
    y: float = Field(..., description="Coordenada Y en el PDF")
    text: str = Field(..., description="Texto de la anotación")
    type: str = Field(default="note", description="Tipo de anotación: note, highlight, comment")
    page: int = Field(default=0, description="Número de página (0-indexed)")


class AnnotateRequest(BaseModel):
    """Solicitud para agregar anotaciones a un PDF."""
    file_id: int = Field(..., description="ID de la versión del documento")
    annotations: List[AnnotationItem] = Field(..., description="Lista de anotaciones")
    
    class Config:
        json_schema_extra = {
            "example": {
                "file_id": 1,
                "annotations": [
                    {
                        "x": 100,
                        "y": 200,
                        "text": "Revisar este párrafo",
                        "type": "note",
                        "page": 0
                    }
                ]
            }
        }


class AnnotateResponse(BaseModel):
    """Respuesta tras procesar anotaciones."""
    success: bool
    message: str
    annotated_version_id: Optional[int] = None
    filename: Optional[str] = None


class SendEmailRequest(BaseModel):
    """Solicitud para enviar correo con PDF."""
    recipient: EmailStr = Field(..., description="Correo del destinatario")
    subject: str = Field(..., description="Asunto del correo")
    body: Optional[str] = Field(None, description="Cuerpo del mensaje")
    file_version_id: int = Field(..., description="ID de la versión del archivo a adjuntar")
    
    class Config:
        json_schema_extra = {
            "example": {
                "recipient": "usuario@itb.edu.ec",
                "subject": "Documento para revisión",
                "body": "Adjunto el documento solicitado.",
                "file_version_id": 1
            }
        }


class SendEmailResponse(BaseModel):
    """Respuesta tras enviar correo."""
    success: bool
    message: str
