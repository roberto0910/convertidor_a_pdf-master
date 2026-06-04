import logging
import os
import uuid
import time
import shutil
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Query, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.db.session import engine
from app.db.base import Base
from app.api.v1.endpoints import auth_router, files_router, signature_router, annotations_router
from app.core.converters import ConverterFactory

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

settings = get_settings()

# Directorios para archivos temporales
TEMP_DIR = Path("temp_files")
TEMP_DIR.mkdir(exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestiona el ciclo de vida de la aplicación."""
    logger.info("🚀 Iniciando aplicación modular de conversión...")
    
    # Asegurar que las tablas existan
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Limpieza al cerrar
    await engine.dispose()
    logger.info("✅ Aplicación cerrada")

app = FastAPI(
    title="API Modular de Conversión PDF",
    description="Conversión de documentos Office a PDF usando el patrón Strategy",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Rutas estáticas para archivos temporales
app.mount("/temp", StaticFiles(directory=TEMP_DIR), name="temp")

# Incluir routers existentes (Auth, Files, Signatures, Annotations)
app.include_router(auth_router)
app.include_router(files_router)
app.include_router(signature_router)
app.include_router(annotations_router)

@app.post("/convert")
async def convert_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
        Endpoint modular para convertir documentos Office a PDF.
        Detecta automáticamente el SO y usa la estrategia adecuada.

        Tipos de archivos soportados (extensiones):
            - Word: .doc, .docx
            - Excel: .xls, .xlsx
            - PowerPoint: .ppt, .pptx
            - Texto y otros: .txt, .rtf
    """
    # 1. Guardar archivo subido en directorio temporal con nombre único
    file_id = str(uuid.uuid4())
    ext = Path(file.filename).suffix
    source_filename = f"{file_id}{ext}"
    source_path = TEMP_DIR / source_filename
    
    try:
        with source_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 2. Obtener convertidor mediante la fábrica (Strategy Pattern)
        converter = ConverterFactory.get_converter()
        logger.info(f"Usando estrategia: {converter.__class__.__name__} para {file.filename}")
        
        # 3. Realizar conversión
        pdf_path = await converter.convert(source_path, TEMP_DIR)
        
        # 4. Programar limpieza del PDF después de enviar
        background_tasks.add_task(os.remove, str(pdf_path))
        
        # 5. Devolver el archivo PDF
        return FileResponse(
            path=pdf_path,
            filename=f"{Path(file.filename).stem}.pdf",
            media_type="application/pdf"
        )
            
    except Exception as e:
        logger.error(f"Error en conversión: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error al convertir el documento: {str(e)}"
        )
    finally:
        # El archivo de origen se borra inmediatamente
        if source_path.exists():
            source_path.unlink()

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "conversion-api"}

@app.get("/")
async def read_root():
    return {
        "message": "Bienvenido a la API Modular de Conversión",
        "docs": "/docs",
        "supported_formats": [".docx", ".xlsx", ".pptx"]
    }



# Rutas estáticas para el frontend (montado al final para no interferir con la API)
frontend_dir = Path("frontend")
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
