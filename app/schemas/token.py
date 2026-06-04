"""
Esquemas Pydantic para tokens JWT.
"""

from typing import Optional
from pydantic import BaseModel, Field


class Token(BaseModel):
    """
    Esquema de respuesta para un token JWT.
    Se retorna al usuario después de autenticarse exitosamente.
    """
    access_token: str = Field(..., description="JWT Access Token")
    token_type: str = Field(
        default="bearer",
        description="Tipo de token (siempre 'bearer' para JWT)"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }
    }


class TokenData(BaseModel):
    """
    Esquema para los datos extraídos del token JWT.
    Se usa internamente para pasar el usuario autenticado.
    """
    email: Optional[str] = Field(
        default=None,
        description="Correo electrónico del usuario (del token)"
    )
