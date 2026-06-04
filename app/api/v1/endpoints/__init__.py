"""
Endpoints de la API v1.
"""

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.files import router as files_router
from app.api.v1.endpoints.signature import router as signature_router
from app.api.v1.endpoints.annotations import router as annotations_router

__all__ = ["auth_router", "files_router", "signature_router", "annotations_router"]
