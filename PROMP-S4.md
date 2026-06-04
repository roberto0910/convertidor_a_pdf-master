Prompt Maestro: Sistema de Permisos y Compartición
"Actúa como un experto en Seguridad Web y FastAPI. Necesito implementar el Sistema de Permisos (Semana 4) para mi proyecto de gestión de documentos.

Objetivos Técnicos:

Modelo de Base de Datos: Crea una tabla Permission que actúe como tabla intermedia entre User y Document. Debe incluir:

id (PK)

user_id (FK a Usuarios)

document_id (FK a Documentos)

permission_level (String: 'owner', 'editor', 'viewer').

Lógica de Compartición: Crea un endpoint POST /documents/{doc_id}/share.

Debe recibir el email del usuario con el que se quiere compartir y el level.

Debe validar que el usuario que comparte sea el 'owner' del documento.

Middleware de Acceso (Dependencia de FastAPI): Crea una función asíncrona verify_document_access(document_id: int, current_user: User, required_level: str).

Esta función debe consultar la tabla Permissions.

Si el usuario no tiene el nivel requerido, debe lanzar una HTTPException con código 403 (Forbidden).

Integración: Muestra un ejemplo de cómo aplicar esta dependencia en el endpoint GET /download/{id} existente.

Instrucciones de Estilo:

Usa SQLAlchemy para las consultas.

Asegúrate de manejar errores (ej: si el usuario con el que quiero compartir no existe).

Devuelve respuestas claras en JSON para que el frontend pueda mostrar mensajes de éxito o error."