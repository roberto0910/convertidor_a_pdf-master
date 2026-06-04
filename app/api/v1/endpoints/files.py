"""
Endpoints para la gestión de archivos y versiones.
"""

import os
import uuid
import shutil
from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.api import deps
from app.models import User, Document, Version, Permission
from app.schemas.document import (
    DocumentResponse, 
    VersionResponse, 
    DocumentWithVersions, 
    ShareDocumentRequest, 
    PermissionResponse
)
from app.core.config import get_settings
from app.core.converters import ConverterFactory

router = APIRouter(
    prefix="/api/v1/files",
    tags=["files"]
)

settings = get_settings()

# Asegurar que el directorio de subidas existe
UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    parent_id: Optional[int] = Query(None, description="ID del documento padre para crear una nueva versión"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Sube un archivo. Si parent_id se proporciona, crea una nueva versión.
    Si no, crea un nuevo documento.
    """
    # Generar nombre único para el archivo en disco
    file_ext = os.path.splitext(file.filename)[1].lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    source_path = UPLOAD_DIR / unique_filename
    
    # Leer contenido y guardar en disco
    content = await file.read()
    
    print(f"DEBUG: upload_file hit. File: {file.filename}, User ID: {current_user.id}")
    with open(source_path, "wb") as buffer:
        buffer.write(content)
    print(f"DEBUG: Saved source to {source_path}")
        
    pdf_path = None
    try:
        # 2. INTEGRACIÓN: Realizar conversión a PDF inmediatamente antes de registrar
        # Esto asegura que en el historial solo queden los productos finales (.pdf)
        converter = ConverterFactory.get_converter()
        temp_dir = source_path.parent
        pdf_path = await converter.convert(source_path, temp_dir)
        
        # Leer el contenido del PDF generado para persistirlo
        with open(pdf_path, "rb") as f:
            pdf_content = f.read()
            file_size = len(pdf_content)
        
        # Generar nombre único final para el PDF en el repositorio permanente (uploads)
        final_pdf_name = f"{uuid.uuid4()}.pdf"
        final_pdf_path = UPLOAD_DIR / final_pdf_name
        
        with open(final_pdf_path, "wb") as buffer:
            buffer.write(pdf_content)
        print(f"DEBUG: Saved PDF to {final_pdf_path}")

        # Nombre amigable que verá el usuario (siempre con .pdf)
        pdf_display_name = f"{Path(file.filename).stem}.pdf"

        if parent_id:
            # Nueva versión para documento existente
            # ADICIÓN SEMANA 4: Verificar que tiene permiso de EDITOR para subir versión
            await deps.verify_document_access(parent_id, db, current_user, "editor")
            
            stmt = select(Document).where(Document.id == parent_id)
            result = await db.execute(stmt)
            document = result.scalar_one_or_none()
            
            if not document:
                raise HTTPException(status_code=404, detail="Documento no encontrado")
            
            # Obtener última versión para incrementar el número
            stmt_v = select(Version).where(Version.document_id == parent_id).order_by(Version.created_at.desc()).limit(1)
            result_v = await db.execute(stmt_v)
            last_version = result_v.scalar_one_or_none()
            
            # Marcar versiones anteriores como no actuales
            await db.execute(
                update(Version).where(Version.document_id == parent_id).values(is_latest=False)
            )
            
            # Calcular nuevo número de versión
            new_v_num = "v1.0"
            if last_version:
                try:
                    v_num_str = last_version.version_number.replace('v', '').split('-')[0]
                    v_parts = v_num_str.split('.')
                    major = int(v_parts[0])
                    minor = int(v_parts[1]) if len(v_parts) > 1 else 0
                    new_v_num = f"v{major}.{minor + 1}"
                except:
                    new_v_num = "v1.1" # Fallback
            
            version = Version(
                document_id=parent_id,
                version_number=new_v_num,
                file_path=str(final_pdf_path),
                file_size=file_size,
                mime_type="application/pdf",
                is_latest=True
            )
            db.add(version)
            await db.commit()
            await db.refresh(document)
            
        else:
            # Nuevo documento
            document = Document(
                name=pdf_display_name,
                user_id=current_user.id
            )
            db.add(document)
            await db.flush() # Para obtener el ID
            
            version = Version(
                document_id=document.id,
                version_number="v1.0",
                file_path=str(final_pdf_path),
                file_size=file_size,
                mime_type="application/pdf",
                is_latest=True
            )
            db.add(version)
            
            # ADICIÓN SEMANA 4: Registrar al creador como OWNER
            permission = Permission(
                user_id=current_user.id,
                document_id=document.id,
                permission_level="owner"
            )
            db.add(permission)
            
            await db.commit()
            await db.refresh(document)
            print(f"DEBUG: Registered document ID {document.id}")

        return FileResponse(
            path=final_pdf_path,
            filename=pdf_display_name,
            media_type="application/pdf",
            headers={
                "X-Document-ID": str(document.id),
                "X-Version-ID": str(version.id)
            }
        )
        
    except Exception as e:
        # Limpiar archivos en caso de error
        if pdf_path and pdf_path.exists():
            pdf_path.unlink()
        raise e
    finally:
        # Siempre limpiar archivo original temporal
        if source_path.exists():
            source_path.unlink()
        if pdf_path and pdf_path.exists():
            pdf_path.unlink()


@router.get("/my-documents", response_model=List[DocumentResponse])
async def get_my_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Lista los documentos a los que el usuario tiene acceso (propios o compartidos).
    Utiliza selectinload para optimizar la carga de versiones.
    """
    # ADICIÓN SEMANA 4: Consultar documentos a través de la tabla de permisos
    # Seleccionamos tanto el Documento como el Permiso correspondiente
    stmt = (
        select(Document, Permission)
        .join(Permission)
        .where(Permission.user_id == current_user.id)
        .options(
            selectinload(Document.versions),
            selectinload(Document.permissions)
        )
        .order_by(Document.created_at.desc())
    )
    result = await db.execute(stmt)
    # result.all() devolverá una lista de tuplas (Document, Permission)
    rows = result.all()
    
    response = []
    for doc, perm in rows:
        # Obtener la versión que tiene is_latest=True
        latest_v = next((v for v in doc.versions if v.is_latest), None)
        
        # Fallback por si acaso ninguna está marcada
        if not latest_v and doc.versions:
            latest_v = sorted(doc.versions, key=lambda x: x.created_at, reverse=True)[0]
        
        doc_res = DocumentResponse.model_validate(doc)
        
        # Llenar campos extra de permisos
        doc_res.permission = perm.permission_level
        doc_res.is_owner = (perm.permission_level == "owner")
        
        # Verificar si el documento ha sido compartido con otros
        # (Si tiene más de un permiso en total)
        if doc_res.is_owner:
            doc_res.shared_with_others = len(doc.permissions) > 1
        else:
            doc_res.shared_with_others = True # Si no soy el dueño, es porque alguien me lo compartió
        
        if latest_v:
            doc_res.latest_version = VersionResponse.model_validate(latest_v)
        response.append(doc_res)
        
    return response


@router.get("/download/{version_id}")
async def download_file(
    version_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Descarga una versión específica de un archivo si tiene permisos.
    """
    # 1. Buscar la versión y el documento asociado
    stmt = select(Version).where(Version.id == version_id).options(selectinload(Version.document))
    result = await db.execute(stmt)
    version = result.scalar_one_or_none()
    
    if not version:
        raise HTTPException(status_code=404, detail="Versión no encontrada")
        
    # 2. ADICIÓN SEMANA 4: Verificar acceso al documento (mínimo viewer)
    await deps.verify_document_access(version.document_id, db, current_user, "viewer")
    
    file_path = Path(version.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="El archivo físico no existe en el servidor")
    
    print(f"DEBUG: Serving file for download. Path: {file_path}, Filename: {version.document.name}")
    
    return FileResponse(
        path=file_path,
        filename=version.document.name,
        media_type=version.mime_type or "application/octet-stream"
    )


@router.post("/{document_id}/share", response_model=PermissionResponse)
async def share_document(
    document_id: int,
    share_data: ShareDocumentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Comparte un documento con otro usuario.
    Solo el 'owner' puede compartir.
    """
    # 1. Verificar que el usuario actual es OWNER
    await deps.verify_document_access(document_id, db, current_user, "owner")
    
    # 2. Buscar al usuario con el que se quiere compartir
    stmt_user = select(User).where(User.email == share_data.email)
    res_user = await db.execute(stmt_user)
    target_user = res_user.scalar_one_or_none()
    
    if not target_user:
        raise HTTPException(status_code=404, detail=f"El usuario con email {share_data.email} no existe.")
        
    # 3. Verificar si ya tiene permiso (para actualizarlo o evitar duplicados)
    stmt_perm = select(Permission).where(
        Permission.document_id == document_id,
        Permission.user_id == target_user.id
    )
    res_perm = await db.execute(stmt_perm)
    # Obtener todos los permisos existentes para limpiar duplicados si existen
    existing_perms = res_perm.scalars().all()
    
    if existing_perms:
        # Nos quedamos con el primero y actualizamos
        perm = existing_perms[0]
        perm.permission_level = share_data.permission_level
        db.add(perm)
        
        # Si hay duplicados, los borramos
        if len(existing_perms) > 1:
            for extra_perm in existing_perms[1:]:
                await db.delete(extra_perm)
    else:
        perm = Permission(
            user_id=target_user.id,
            document_id=document_id,
            permission_level=share_data.permission_level
        )
        db.add(perm)
        
    await db.commit()
    await db.refresh(perm)
    return perm


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Elimina un documento y todas sus versiones y archivos físicos.
    Solo el dueño (owner) puede eliminar.
    """
    # 1. Verificar que es OWNER
    await deps.verify_document_access(document_id, db, current_user, "owner")
    
    stmt = select(Document).where(Document.id == document_id)
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    # Obtener todas las versiones para borrar archivos físicos
    stmt_v = select(Version).where(Version.document_id == document_id)
    result_v = await db.execute(stmt_v)
    versions = result_v.scalars().all()
    
    for v in versions:
        file_path = Path(v.file_path)
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception as e:
                print(f"Error borrando archivo {file_path}: {e}")
                
    await db.delete(document)
    await db.commit()
    return None
