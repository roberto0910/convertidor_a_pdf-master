/**
 * Módulo de Carga y Conversión de Archivos (Upload)
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('📦 Módulo de Carga (Upload) Inicializado');

    // Obtener la URL de la API desde la configuración global
    const API_URL = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || "http://localhost:8000";

    // Elementos del DOM del módulo
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const dropArea = document.getElementById('dropArea');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileDate = document.getElementById('fileDate');
    const fileType = document.getElementById('fileType');
    const fileIcon = document.getElementById('fileIcon');
    const convertBtn = document.getElementById('convertBtn');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const conversionOptions = document.getElementById('conversionOptions');
    const formatInfo = document.getElementById('formatInfo');
    const downloadLink = document.getElementById('downloadLink');
    const downloadLinkContainer = document.getElementById('downloadLinkContainer');

    if (!fileInput || !selectFileBtn || !dropArea || !convertBtn) {
        console.warn('⚠️ Elementos del DOM del módulo Upload no encontrados por completo');
        return;
    }

    // Inicializar eventos del selector de archivos
    selectFileBtn.addEventListener('click', function () {
        fileInput.click();
    });

    fileInput.addEventListener('change', function () {
        if (this.files.length > 0) {
            const file = this.files[0];
            console.log('📄 Archivo seleccionado:', file.name, 'Tipo:', file.type);
            processFile(file);
        }
    });

    // Funcionalidad de arrastrar y soltar (Drag and Drop)
    dropArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        this.style.borderColor = "var(--itb-primary)";
        this.style.backgroundColor = "rgba(52, 152, 219, 0.1)";
    });

    dropArea.addEventListener('dragleave', function () {
        this.style.borderColor = "";
        this.style.backgroundColor = "";
    });

    dropArea.addEventListener('drop', function (e) {
        e.preventDefault();
        this.style.borderColor = "";
        this.style.backgroundColor = "";

        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            fileInput.files = e.dataTransfer.files;
            console.log('📄 Archivo arrastrado:', file.name);
            processFile(file);
        }
    });

    // Eliminar archivo cargado
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', function () {
            window.currentFile = null;
            fileInput.value = '';
            if (fileInfo) fileInfo.style.display = 'none';
            if (typeof window.hideMessages === 'function') window.hideMessages();
        });
    }

    // Evento para iniciar la conversión
    convertBtn.addEventListener('click', async function () {
        if (!window.currentFile) {
            if (typeof window.showError === 'function') window.showError('Por favor, seleccione un archivo');
            return;
        }

        await convertWithAPI();
        window.currentParentId = null; // Restablecer el ID de versión padre tras la conversión
    });

    // Procesar archivo seleccionado o arrastrado
    function processFile(file) {
        const validExtensions = ['.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.txt', '.rtf'];
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();

        if (!validExtensions.includes(fileExt)) {
            if (typeof window.showError === 'function') {
                window.showError(`Formato no soportado. Formatos permitidos: Word (.docx, .doc), Excel (.xlsx, .xls), PowerPoint (.pptx, .ppt), Texto (.txt, .rtf)`);
            }
            return;
        }

        // Validar tamaño máximo de 50MB
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            if (typeof window.showError === 'function') window.showError(`Archivo muy grande. Máximo: 50MB`);
            return;
        }

        window.currentFile = file;
        updateFileInfo(file);
        if (typeof window.hideMessages === 'function') window.hideMessages();
        updateFormatInfo();
    }

    // Actualizar información visual del archivo
    function updateFileInfo(file) {
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        const typeName = typeof window.getFileTypeName === 'function' ? window.getFileTypeName(fileExt) : 'Documento';
        const iconClass = typeof window.getFileIconClass === 'function' ? window.getFileIconClass(fileExt) : 'fa-file';

        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = typeof window.formatFileSize === 'function' ? window.formatFileSize(file.size) : `${file.size} B`;
        if (fileType) fileType.textContent = typeName;
        if (fileIcon) {
            fileIcon.className = `fas ${iconClass}`;
            if (typeof window.getFileIconColor === 'function') {
                fileIcon.style.color = window.getFileIconColor(fileExt);
            }
        }

        const date = new Date(file.lastModified);
        if (fileDate) {
            fileDate.textContent = date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        if (fileInfo) {
            fileInfo.style.display = 'block';
        }
    }

    // Actualizar información sobre formatos
    function updateFormatInfo() {
        if (formatInfo) {
            formatInfo.innerHTML = `
                <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 10px;">
                    <span style="display: inline-flex; align-items: center; gap: 5px;">
                        <i class="fas fa-file-word" style="color: #2B579A;"></i> Word (.docx, .doc)
                    </span>
                    <span style="display: inline-flex; align-items: center; gap: 5px;">
                        <i class="fas fa-file-excel" style="color: #217346;"></i> Excel (.xlsx, .xls)
                    </span>
                    <span style="display: inline-flex; align-items: center; gap: 5px;">
                        <i class="fas fa-file-powerpoint" style="color: #D24726;"></i> PowerPoint (.pptx, .ppt)
                    </span>
                </div>
            `;
        }
    }

    // Convertir usando la API del backend
    async function convertWithAPI() {
        const formData = new FormData();
        formData.append("file", window.currentFile);

        // Mostrar loading
        convertBtn.disabled = true;
        const originalText = convertBtn.innerHTML;
        convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando a servidor...';

        if (typeof window.hideMessages === 'function') window.hideMessages();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos de timeout

            // Validar expiración de sesión del token
            if (typeof window.getToken === 'function' && typeof window.isTokenExpired === 'function') {
                const token = window.getToken();
                if (token && window.isTokenExpired(token)) {
                    console.warn('🕒 Sesión expirada detectada al intentar convertir');
                    if (typeof window.showError === 'function') {
                        window.showError('Tu sesión ha expirado. Por favor, cierra sesión y vuelve a entrar para guardar en tu historial.');
                    }
                }
            }

            // Seleccionar endpoint: /upload para usuarios con sesión (guarda en DB), /convert para usuarios libres
            const isAuth = typeof window.isAuthenticated === 'function' ? window.isAuthenticated() : false;
            let endpoint = isAuth
                ? `${API_URL}/api/v1/files/upload`
                : `${API_URL}/convert`;

            if (isAuth && window.currentParentId) {
                endpoint += `?parent_id=${window.currentParentId}`;
            }

            console.log(`📡 [Upload] Usando endpoint: ${endpoint} (Autenticado: ${isAuth})`);

            const headers = {};
            if (isAuth && typeof window.getToken === 'function') {
                headers['Authorization'] = `Bearer ${window.getToken()}`;
            }

            const response = await fetch(endpoint, {
                method: "POST",
                headers: headers,
                body: formData,
                signal: controller.signal
            }).catch(error => {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    throw new Error('Tiempo de espera agotado. El servidor no respondió.');
                }
                throw error;
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorMessage = `Error ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.error || errorMessage;
                } catch (e) {
                    const errorText = await response.text();
                    if (errorText) {
                        errorMessage = errorText.substring(0, 200);
                    }
                }
                throw new Error(errorMessage);
            }

            // Validar que la respuesta sea un PDF
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/pdf')) {
                throw new Error('El servidor no devolvió un PDF válido');
            }

            const pdfBlob = await response.blob();
            console.log(`[Upload] PDF recibido: ${pdfBlob.size} bytes`);

            if (pdfBlob.size === 0) {
                throw new Error('El PDF recibido está vacío');
            }

            // Procesar el PDF resultante
            await processConvertedPDF(pdfBlob);

            // Sincronizar el historial si está autenticado
            if (isAuth && typeof window.loadHistory === 'function') {
                console.log('🔄 Sincronizando historial con la base de datos...');
                await window.loadHistory();
            }

        } catch (error) {
            console.error('[ERROR] Error en conversión API:', error);

            let displayErr = error.message || 'Error al convertir el archivo. Intente nuevamente.';
            if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
                displayErr = `No se puede conectar al servidor en ${API_URL}. Verifica que el servidor esté corriendo.`;
            } else if (error.message.includes('Tiempo de espera')) {
                displayErr = 'El servidor tardó demasiado en responder. Intenta nuevamente.';
            }

            if (typeof window.showError === 'function') {
                window.showError(displayErr);
            }
        } finally {
            convertBtn.disabled = false;
            convertBtn.innerHTML = originalText;
        }
    }

    // Procesar PDF convertido y programar descarga
    async function processConvertedPDF(pdfBlob) {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const pdfFilename = window.currentFile.name.replace(/\.[^/.]+$/, "") + ".pdf";

        const sizeStr = typeof window.formatFileSize === 'function' ? window.formatFileSize(pdfBlob.size) : `${pdfBlob.size} B`;
        console.log(`[Upload] PDF Procesado: ${sizeStr}`);

        // Guardar en historial local únicamente si NO está autenticado
        const isAuth = typeof window.isAuthenticated === 'function' ? window.isAuthenticated() : false;
        if (!isAuth) {
            const conversionRecord = {
                id: Date.now(),
                originalName: window.currentFile.name,
                originalType: window.currentFile.name.split('.').pop().toLowerCase(),
                originalSize: typeof window.formatFileSize === 'function' ? window.formatFileSize(window.currentFile.size) : `${window.currentFile.size} B`,
                pdfName: pdfFilename,
                pdfSize: sizeStr,
                pdfUrl: pdfUrl,
                date: new Date().toISOString(),
                convertedWith: 'api'
            };

            if (Array.isArray(window.conversionHistory)) {
                window.conversionHistory.unshift(conversionRecord);
                if (window.conversionHistory.length > 30) {
                    if (window.conversionHistory[30].pdfUrl) {
                        URL.revokeObjectURL(window.conversionHistory[30].pdfUrl);
                    }
                    window.conversionHistory = window.conversionHistory.slice(0, 30);
                }
                if (typeof window.saveToLocalStorage === 'function') {
                    window.saveToLocalStorage();
                }
            }
        }

        // Configurar enlace para botón del modal
        if (downloadLink) {
            downloadLink.href = pdfUrl;
            downloadLink.download = pdfFilename;

            // Iniciar descarga automática después de un pequeño intervalo
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = pdfFilename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, 500);
        }

        // Mostrar alerta de éxito
        const successMsg = isAuth
            ? `✅ ${pdfFilename} guardado en tu historial y listo para descargar`
            : `✅ ${window.currentFile.name} convertido exitosamente a PDF<br>
               <small>Tamaño: ${sizeStr} • Listo para descargar</small>`;

        if (typeof window.showSuccess === 'function') {
            window.showSuccess(successMsg);
        }

        // Limpiar recursos tras una hora en memoria
        setTimeout(() => {
            URL.revokeObjectURL(pdfUrl);
            console.log('🧹 URL del PDF temporal liberada de memoria');
        }, 3600000);
    }
});
