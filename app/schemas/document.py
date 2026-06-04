"""
Esquemas Pydantic para Documentos y Versiones.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class VersionBase(BaseModel):
    version_number: str
    file_size: int
    mime_type: Optional[str] = None
    is_latest: bool = True


class VersionCreate(VersionBase):
    document_id: int
    file_path: str


class VersionResponse(VersionBase):
    id: int
    document_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PermissionResponse(BaseModel):
    id: int
    user_id: int
    document_id: int
    permission_level: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShareDocumentRequest(BaseModel):
    email: str
    permission_level: str # 'editor', 'viewer'


class DocumentBase(BaseModel):
    name: str


class DocumentCreate(DocumentBase):
    pass


class DocumentResponse(DocumentBase):
    id: int
    user_id: int
    created_at: datetime
    latest_version: Optional[VersionResponse] = None
    permission: Optional[str] = None # 'owner', 'editor', 'viewer'
    is_owner: bool = False
    shared_with_others: bool = False
    shared_externally: bool = False
    
    model_config = ConfigDict(from_attributes=True)


class DocumentWithVersions(DocumentResponse):
    versions: List[VersionResponse] = []


class SignatureValidationResponse(BaseModel):
    is_valid: bool
    signer_name: Optional[str] = None
    timestamp: Optional[datetime] = None
    trusted: bool
