"""
Servicio para manipulación de PDFs con PyMuPDF.
Incluye funciones para agregar anotaciones a documentos PDF.
"""

import fitz  # PyMuPDF
from pathlib import Path
from typing import List, Tuple
import logging

logger = logging.getLogger(__name__)


class PDFAnnotationService:
    """Servicio para agregar anotaciones a PDFs usando PyMuPDF."""
    
    @staticmethod
    def add_annotations(
        input_pdf_path: Path,
        output_pdf_path: Path,
        annotations: List[dict]
    ) -> bool:
        """
        Agrega anotaciones a un PDF.
        
        Args:
            input_pdf_path: Ruta del PDF original
            output_pdf_path: Ruta donde guardar el PDF anotado
            annotations: Lista de diccionarios con estructura:
                {
                    'x': float,
                    'y': float,
                    'text': str,
                    'type': str,  # 'note', 'highlight', 'comment'
                    'page': int   # Número de página (0-indexed)
                }
        
        Returns:
            bool: True si fue exitoso
        
        Raises:
            FileNotFoundError: Si el PDF no existe
            ValueError: Si el PDF está corrupto o las coordenadas son inválidas
        """
        if not input_pdf_path.exists():
            raise FileNotFoundError(f"PDF no encontrado: {input_pdf_path}")
        
        try:
            # Abrir el documento PDF
            doc = fitz.open(str(input_pdf_path))
            
            logger.info(f"Procesando {len(annotations)} anotaciones en PDF con {doc.page_count} páginas")
            
            for annot in annotations:
                page_num = annot.get('page', 0)
                x = annot['x']
                y = annot['y']
                text = annot['text']
                annot_type = annot.get('type', 'note')
                
                # Validar número de página
                if page_num < 0 or page_num >= doc.page_count:
                    logger.warning(f"Página {page_num} fuera de rango, usando página 0")
                    page_num = 0
                
                page = doc[page_num]

                # Obtener dimensiones de la página
                page_rect = page.rect

                # Nota: el frontend envía coordenadas en un sistema con origen
                # en la esquina inferior izquierda (PDF native). PyMuPDF usa
                # coordenadas con origen superior izquierdo para dibujar.
                # Convertimos Y: y_page = page_height - y
                try:
                    x = float(x)
                    y = float(y)
                except Exception:
                    logger.warning(f"Coordenadas no numéricas: {x}, {y}; se omite anotación")
                    continue

                # Validar rango en sistema recibido (0..width, 0..height)
                if not (0 <= x <= page_rect.width and 0 <= y <= page_rect.height):
                    logger.warning(f"Coordenadas ({x}, {y}) fuera de rango de página")
                    x = min(max(0.0, x), page_rect.width - 50)
                    y = min(max(0.0, y), page_rect.height - 20)

                # Convertir a coordenadas de PyMuPDF (origen superior)
                y_page = page_rect.height - y
                x_page = x

                # Agregar anotación según el tipo usando coordenadas convertidas
                if annot_type == 'note':
                    PDFAnnotationService._add_text_note(page, x_page, y_page, text)
                elif annot_type == 'highlight':
                    PDFAnnotationService._add_highlight(page, x_page, y_page, text)
                elif annot_type == 'comment':
                    PDFAnnotationService._add_comment(page, x_page, y_page, text)
                else:
                    PDFAnnotationService._add_text_note(page, x_page, y_page, text)
            
            # Guardar el documento anotado
            doc.save(str(output_pdf_path))
            doc.close()
            
            logger.info(f"PDF anotado guardado en: {output_pdf_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error al procesar anotaciones: {e}")
            raise ValueError(f"Error al procesar PDF: {str(e)}")
    
    @staticmethod
    def _add_text_note(page: fitz.Page, x: float, y: float, text: str):
        """Agrega una nota de texto al PDF."""
        # Crear rectángulo para la anotación
        # PyMuPDF usa (x0, y0, x1, y1) donde (x0,y0) es esquina superior izquierda
        rect = fitz.Rect(x, y, x + 150, y + 40)
        
        # Agregar anotación de texto (Tipo "Sticky Note")
        # Se prefiere este tipo porque es interactivo y estándar en lectores de PDF.
        annot = page.add_text_annot(
            point=(x, y),
            text=text,
            icon="Note"  # Opciones: Note, Comment, Help, Insert, Key, NewParagraph, Paragraph
        )
        
        # Configurar color (amarillo claro)
        annot.set_colors(stroke=(1, 1, 0))
        annot.update()
    
    @staticmethod
    def _add_highlight(page: fitz.Page, x: float, y: float, text: str):
        """Agrega un área de resaltado con texto."""
        # Crear rectángulo para el área a resaltar
        rect = fitz.Rect(x, y, x + 150, y + 20)
        
        # Agregar anotación de resaltado
        highlight = page.add_highlight_annot(rect)
        highlight.set_colors(stroke=(1, 1, 0))  # Amarillo
        highlight.set_info(content=text)
        highlight.update()
    
    @staticmethod
    def _add_comment(page: fitz.Page, x: float, y: float, text: str):
        """Agrega un comentario con texto más largo."""
        # Insertar texto directamente en la página
        # Esto es más visible que una anotación
        fontsize = 10
        color = (1, 0, 0)  # Rojo
        
        # Crear un pequeño cuadro de texto
        rect = fitz.Rect(x, y, x + 200, y + 50)
        
        # Agregar rectángulo de fondo
        page.draw_rect(rect, color=(1, 1, 0.8), fill=(1, 1, 0.8), width=0.5)
        
        # Insertar texto
        rc = page.insert_textbox(
            rect,
            text,
            fontsize=fontsize,
            color=color,
            align=fitz.TEXT_ALIGN_LEFT
        )
        
        if rc < 0:
            logger.warning(f"No se pudo insertar todo el texto del comentario")
    
    @staticmethod
    def validate_pdf(pdf_path: Path) -> Tuple[bool, str]:
        """
        Valida que un archivo sea un PDF válido.
        
        Returns:
            Tuple[bool, str]: (es_válido, mensaje_error)
        """
        try:
            if not pdf_path.exists():
                return False, "Archivo no encontrado"
            
            doc = fitz.open(str(pdf_path))
            page_count = doc.page_count
            doc.close()
            
            if page_count == 0:
                return False, "El PDF no contiene páginas"
            
            return True, f"PDF válido con {page_count} página(s)"
            
        except Exception as e:
            return False, f"Error al abrir PDF: {str(e)}"
