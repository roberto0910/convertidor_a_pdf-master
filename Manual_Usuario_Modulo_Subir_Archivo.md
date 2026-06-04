# INSTITUTO SUPERIOR UNIVERSITARIO BOLIVARIANO
# DE TECNOLOGÍA
## Carrera Técnico en Desarrollo de Software

**Proyecto: Diseño y Desarrollo del Sistema de Gestión Documental**

### Manual de usuario - Módulo de Subir Archivo
**VERSIÓN:** 1.0  
**FECHA DE REVISIÓN:** 30/5/2026

**Encargado:**
- Responsable del Cambio: [Nombre del Desarrollador/Estudiante]
- Aprobado por: [Nombre del Tutor/Director]

| Versión | Fecha |
| :--- | :--- |
| 1.0 | 30/5/2026 |

---

## Índice de Contenidos

*   [Sección 1 Introducción](#sección-1-introducción)
    *   [1.1 Pre-requisitos](#11-pre-requisitos)
    *   [1.2 Alcances](#12-alcances)
    *   [1.3 Breve descripción del producto](#13-breve-descripción-del-producto)
    *   [1.4 Taxonomía](#14-taxonomía)
*   [Sección 2 Desarrollo](#sección-2-desarrollo)
    *   [2.1 Pre-requisitos funcionales](#21-pre-requisitos-funcionales)
    *   [2.2 Usuarios y roles](#22-usuarios-y-roles)
    *   [2.3 Descripción de los módulos](#23-descripción-de-los-módulos)

---

## Sección 1 Introducción

### 1.1 Pre-requisitos
Antes de utilizar el Módulo de Subir Archivo del Sistema de Gestión Documental, el usuario debe cumplir con los siguientes requisitos:
– Contar con un dispositivo (computadora de escritorio, laptop, tablet o smartphone) con un navegador web moderno actualizado (Chrome, Firefox, Edge, Safari).
– Tener acceso al sistema mediante la URL correspondiente (ej. `http://localhost:3000` o dominio en producción).
– Contar con un usuario y contraseña previamente registrado y validado en el sistema.
– Disponer de una conexión estable a Internet o red local para la carga de documentos y sincronización con el servidor backend.
– Tener el archivo que se desea subir almacenado localmente en el dispositivo (formatos compatibles como .docx, .txt, .pdf, etc.).

### 1.2 Alcances
El módulo está diseñado para facilitar la carga, conversión automática y control de versiones de los documentos dentro del Sistema de Gestión Documental.

Este manual cubre las funciones principales del módulo para los usuarios del sistema:
– Carga inicial de un nuevo documento al sistema.
– Conversión automática e inmediata de documentos ofimáticos al formato estandarizado PDF.
– Creación y gestión de nuevas versiones de un documento existente (v1.0, v1.1, etc.).
– Restricción de permisos, permitiendo subir nuevas versiones únicamente a los usuarios con rol de Creador (Owner) o Editor del documento.

*   Limitaciones del sistema:
    – El sistema convierte el archivo de origen a PDF y descarta el original temporal para optimizar espacio y asegurar que en el historial solo queden los productos finales.
    – Requiere de conexión al servidor backend activo para realizar la carga y conversión.

### 1.3 Breve descripción del producto
El Módulo de Subir Archivo es un componente fundamental del Sistema de Gestión Documental, desarrollado con FastAPI en el backend y una interfaz web moderna en el frontend. Su objetivo principal es permitir a los usuarios almacenar documentos de forma centralizada y segura.

Con este módulo se pueden realizar tareas como:
– Registrar nuevos documentos en la plataforma de manera intuitiva.
– Asegurar la uniformidad de la información al convertir automáticamente los archivos subidos al formato PDF.
– Mantener un historial trazable de cambios mediante el control automático de versiones incrementales.
– Garantizar la seguridad e integridad del archivo asegurando que solo usuarios autorizados (Owner/Editor) modifiquen los documentos.

La aplicación se maneja a través de una interfaz web, lo que permite a los usuarios gestionar sus documentos de forma rápida y sencilla desde cualquier equipo.

### 1.4 Taxonomía
La taxonomía es un glosario de términos técnicos que se usarán de forma frecuente en el sistema. Esto ayuda a que el usuario entienda mejor el significado de ciertas palabras y cómo se aplican dentro del módulo:
– **Usuario:** Persona que accede al sistema mediante correo electrónico y contraseña.
– **Owner (Dueño):** Usuario creador del documento. Tiene control total, incluyendo permisos para subir versiones, compartir y eliminar el archivo.
– **Editor:** Usuario invitado a colaborar en un documento. Puede subir nuevas versiones, pero no puede eliminar ni compartir el archivo con terceros.
– **Viewer (Lector):** Usuario invitado a un documento con permisos de solo lectura. Solo puede descargar y visualizar el archivo.
– **Documento:** Registro principal en el sistema que agrupa las distintas versiones de un archivo cargado.
– **Versión:** Iteración específica de un documento (ej. v1.0, v1.1). Cada vez que se sube una actualización, se genera una nueva versión conservando el historial.
– **Conversión:** Proceso automatizado en el servidor (backend) que toma un documento original (como Word o Texto) y lo transforma a formato PDF.
– **Frontend / Backend:** El frontend es la interfaz gráfica que ve el usuario; el backend es el servidor lógico que procesa la subida de archivos y la base de datos.
– **Token de Acceso:** Credencial de seguridad que valida la identidad del usuario durante su sesión activa para autorizar la subida de archivos.

---

## Sección 2 Desarrollo

### 2.1 Pre-requisitos funcionales
El Módulo de Subir Archivo cuenta con funcionalidades clave que garantizan la integridad y el correcto flujo documental:
*   **Gestión de Carga:**
    – El sistema permite la selección de un archivo local a través de una ventana emergente del sistema operativo o mediante un botón de carga.
    – Validación automática para que el documento se procese y guarde exitosamente.
*   **Control de Versiones:**
    – Al subir una actualización a un documento existente, el sistema genera automáticamente un identificador incremental (de v1.0 pasa a v1.1).
    – El sistema marca la versión recién subida como la "versión actual" y archiva las versiones previas en el historial.
*   **Conversión y Almacenamiento:**
    – Conversión inmediata del archivo a PDF antes de registrarse en la base de datos.
    – Almacenamiento seguro del archivo PDF resultante en el repositorio del servidor, generando un nombre único codificado (UUID).
*   **Seguridad:**
    – Verificación estricta de permisos antes de permitir la subida: para una "Nueva Versión", el usuario actual debe ser Owner o tener nivel Editor. Los usuarios nivel Viewer serán rechazados.
    – Al crear un nuevo documento, el sistema asigna automáticamente al creador el permiso de Owner.

### 2.2 Usuarios y roles
En el Sistema de Gestión Documental, el módulo de Subir Archivo interactúa directamente con el esquema de permisos de los documentos:

| Nombre del Rol | Descripción | Privilegios en el Módulo de Subida |
| :--- | :--- | :--- |
| **Owner (Propietario)** | Creador del documento. Acceso total. | Puede subir archivos nuevos y subir nuevas versiones libremente a sus documentos. |
| **Editor** | Usuario invitado con permisos de edición. | Puede subir nuevas versiones a un documento que le han compartido. No puede subir archivos base en nombre de otros. |
| **Viewer (Lector)** | Usuario invitado para lectura. | No tiene acceso a subir archivos o actualizar el documento. Opción bloqueada en la interfaz. |

*Nota: La tabla presenta los niveles de permisos sobre un documento específico, no roles globales.*

### 2.3 Descripción de los módulos

#### Módulo de Subir Archivo (Nuevo Documento)
Este módulo permite al usuario ingresar un nuevo documento al sistema desde la pantalla principal.

*   **Funciones principales:**
    – Seleccionar el archivo local desde el dispositivo haciendo clic en el botón de "Nuevo Documento" o "Subir Archivo".
    – Enviar el archivo al servidor para su conversión a PDF.
    – Asignar automáticamente el usuario actual como "Owner" (Dueño) del nuevo archivo.
    – Registrar el documento con su primera versión (v1.0).

Este proceso garantiza que cualquier archivo introducido al sistema quede estandarizado y vinculado directamente a la cuenta del usuario que lo creó.

#### Módulo de Subir Nueva Versión
Este módulo se utiliza cuando un documento ya existe y el usuario requiere actualizar su contenido sin perder el registro original.

*   **Funciones principales:**
    – Acceder a las opciones del documento en el listado y seleccionar el botón de "Nueva Versión" (generalmente representado por un ícono de actualización).
    – Validar que el usuario tenga los permisos necesarios (Owner o Editor). Si el usuario es solo Viewer, la opción no será visible o mostrará un error de permisos.
    – Seleccionar el nuevo archivo modificado desde el almacenamiento local.
    – El sistema convierte el nuevo archivo a PDF y calcula el nuevo número de versión incrementándolo de forma automática (ej. v1.1, v1.2).
    – Marcar la nueva subida como la versión actual (`is_latest`), dejando la versión anterior en el historial para futuras consultas o descargas.

Este módulo asegura que todas las iteraciones de un documento se mantengan organizadas y bajo un estricto control de acceso y trazabilidad.
