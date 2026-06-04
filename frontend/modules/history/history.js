/**
 * Módulo de Historial y Acciones Documentales (History)
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('📦 Módulo de Historial (History) Inicializado');

    const API_URL = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || "http://localhost:8000";

    // --- ELEMENTOS DEL DOM PARA MODALES ---

    // 1. MODAL DE COMPARTIR
    const shareModal = document.getElementById('shareModal');
    const shareForm = document.getElementById('shareForm');
    const closeModal = document.querySelector('.close-modal');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    let currentShareDocId = null;
    let currentShareVersionId = null;

    // 2. MODAL DE FIRMA DIGITAL
    const signModal = document.getElementById('signModal');
    const signForm = document.getElementById('signForm');
    const closeModalSign = document.querySelector('.close-modal-sign');
    const closeModalSignBtn = document.querySelector('.close-modal-sign-btn');
    let currentSignDocId = null;

    // 3. MODAL DE ANOTACIONES
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    const annotateModal = document.getElementById('annotateModal');
    const pdfCanvas = document.getElementById('pdfCanvas');
    const pdfCtx = pdfCanvas ? pdfCanvas.getContext('2d') : null;
    const annotationsOverlay = document.getElementById('annotationsOverlay');
    const floatingNoteForm = document.getElementById('floatingNoteForm');
    const noteText = document.getElementById('noteText');
    const currentAnnotatePageSpan = document.getElementById('currentAnnotatePage');
    const totalAnnotatePagesSpan = document.getElementById('totalAnnotatePages');

    let annotateState = {
        pdfDoc: null,
        pageNum: 1,
        scale: 1.5,
        versionId: null,
        annotations: [], // Lista de anotaciones
        currentClick: null,
        annotatedVersionId: null
    };

    // --- COMPARTIR DOCUMENTO (SHARE MODAL) ---

    function openShareModal(docId, docName, versionId) {
        currentShareDocId = docId;
        currentShareVersionId = versionId;
        const nameEl = document.getElementById('shareFileName');
        if (nameEl) nameEl.textContent = docName;

        const emailInput = document.getElementById('shareEmail');
        if (emailInput) emailInput.value = '';

        if (document.getElementById('shareSubject')) {
            document.getElementById('shareSubject').value = `Documento compartido: ${docName}`;
        }

        const levelSelect = document.getElementById('shareLevel');
        if (levelSelect) levelSelect.value = 'viewer';

        const errorEl = document.getElementById('shareError');
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }

        if (shareModal) shareModal.style.display = 'block';
    }

    function closeShareModal() {
        if (shareModal) shareModal.style.display = 'none';
        currentShareDocId = null;
        currentShareVersionId = null;
    }

    if (closeModal) closeModal.addEventListener('click', closeShareModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeShareModal);

    window.addEventListener('click', function (event) {
        if (event.target === shareModal) {
            closeShareModal();
        }
    });

    if (shareForm) {
        shareForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const email = document.getElementById('shareEmail').value;
            const subject = document.getElementById('shareSubject').value;
            const level = document.getElementById('shareLevel').value;
            const errorEl = document.getElementById('shareError');

            if (!email || !currentShareDocId || !currentShareVersionId) {
                if (errorEl) {
                    errorEl.textContent = 'Error: Información del documento incompleta.';
                    errorEl.style.display = 'block';
                }
                return;
            }

            if (errorEl) {
                errorEl.style.display = 'none';
                errorEl.textContent = '';
            }

            // Validar dominio institucional para compartir con permisos de edición/lectura
            if (level !== 'none' && !email.toLowerCase().endsWith('@itb.edu.ec')) {
                if (errorEl) {
                    errorEl.textContent = 'Correo inválido: debe ser @itb.edu.ec para asignar permisos.';
                    errorEl.style.display = 'block';
                }
                return;
            }

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

            try {
                // 1. Asignar permiso interno
                if (level !== 'none') {
                    const shareResponse = await fetch(`${API_URL}/api/v1/files/${currentShareDocId}/share`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${window.getToken()}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email: email,
                            permission_level: level
                        })
                    });

                    if (shareResponse.status === 401 && typeof window.logout === 'function') {
                        window.logout();
                        return;
                    }

                    if (!shareResponse.ok) {
                        const errorData = await shareResponse.json();
                        throw new Error(errorData.detail || 'Error al asignar permisos en el sistema');
                    }
                }

                // 2. Enviar correo adjunto externamente
                const emailResponse = await fetch(`${API_URL}/api/v1/annotations/send-email`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${window.getToken()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        recipient: email,
                        subject: subject,
                        file_version_id: parseInt(currentShareVersionId)
                    })
                });

                if (emailResponse.status === 401 && typeof window.logout === 'function') {
                    window.logout();
                    return;
                }

                if (!emailResponse.ok) {
                    const errorData = await emailResponse.json();
                    console.warn('Permisos asignados pero no se pudo enviar el correo:', errorData.detail);
                }

                if (typeof window.showSuccess === 'function') {
                    window.showSuccess(`Documento enviado a <b>${email}</b> correctamente.`);
                }
                document.getElementById('shareEmail').value = '';
                closeShareModal();

                if (typeof window.loadHistory === 'function') {
                    await window.loadHistory();
                }
            } catch (error) {
                console.error('Error en proceso de compartir:', error);
                if (errorEl) {
                    errorEl.textContent = error.message;
                    errorEl.style.display = 'block';
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // --- FIRMA DIGITAL (SIGN MODAL) ---

    function openSignModal(docId, docName) {
        currentSignDocId = docId;
        const nameEl = document.getElementById('signFileName');
        if (nameEl) nameEl.textContent = docName;

        const p12Input = document.getElementById('p12File');
        if (p12Input) p12Input.value = '';

        const passInput = document.getElementById('p12Password');
        if (passInput) passInput.value = '';

        const errorEl = document.getElementById('signError');
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }

        if (signModal) signModal.style.display = 'block';
    }

    function closeSignModal() {
        if (signModal) signModal.style.display = 'none';
        currentSignDocId = null;
    }

    if (closeModalSign) closeModalSign.addEventListener('click', closeSignModal);
    if (closeModalSignBtn) closeModalSignBtn.addEventListener('click', closeSignModal);

    if (signForm) {
        signForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const p12File = document.getElementById('p12File').files[0];
            const password = document.getElementById('p12Password').value;
            const errorEl = document.getElementById('signError');

            if (!p12File || !password) {
                if (errorEl) {
                    errorEl.textContent = 'Error: Se requiere subir el archivo .p12 y la contraseña';
                    errorEl.style.display = 'block';
                }
                return;
            }

            if (!currentSignDocId) return;

            const submitBtn = document.getElementById('confirmSignBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

            try {
                await signDocumentAPI(currentSignDocId, p12File, password);
                closeSignModal();
                if (typeof window.showSuccess === 'function') {
                    window.showSuccess(`✅ Documento firmado exitosamente.`);
                }
                if (typeof window.loadHistory === 'function') {
                    await window.loadHistory();
                }
            } catch (error) {
                console.error('Error al firmar:', error);
                if (errorEl) {
                    errorEl.textContent = error.message;
                    errorEl.style.display = 'block';
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    async function signDocumentAPI(docId, file, password) {
        const formData = new FormData();
        formData.append('document_id', docId);
        formData.append('p12_file', file);
        formData.append('password', password);

        const response = await fetch(`${API_URL}/documents/sign`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${window.getToken()}` },
            body: formData
        });

        if (response.status === 400) {
            throw new Error('Certificado inválido o contraseña incorrecta (400)');
        }

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || 'Error al procesar la firma');
        }

        return await response.json();
    }

    // --- ANOTACIONES DE PDF (ANNOTATE MODAL) ---

    async function openAnnotateModal(versionId, fileName) {
        if (!versionId) return;
        annotateState.versionId = versionId;
        annotateState.annotations = [];
        annotateState.pageNum = 1;
        if (annotationsOverlay) annotationsOverlay.innerHTML = '';
        const nameEl = document.getElementById('annotateFileName');
        if (nameEl) nameEl.textContent = fileName;

        if (annotateModal) annotateModal.style.display = 'block';

        try {
            const url = `${API_URL}/api/v1/files/download/${versionId}`;
            const loadingTask = pdfjsLib.getDocument({
                url: url,
                httpHeaders: { 'Authorization': `Bearer ${window.getToken()}` }
            });

            annotateState.pdfDoc = await loadingTask.promise;
            if (totalAnnotatePagesSpan) totalAnnotatePagesSpan.textContent = annotateState.pdfDoc.numPages;
            await renderAnnotatePage(annotateState.pageNum);
        } catch (error) {
            console.error('Error al cargar PDF:', error);
            if (typeof window.showError === 'function') {
                window.showError('No se pudo cargar la previsualización del PDF.');
            }
            closeAnnotateModal();
        }
    }

    async function renderAnnotatePage(num) {
        if (!annotateState.pdfDoc || !pdfCanvas || !pdfCtx) return;

        const page = await annotateState.pdfDoc.getPage(num);
        const viewport = page.getViewport({ scale: annotateState.scale });

        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;

        const renderContext = {
            canvasContext: pdfCtx,
            viewport: viewport
        };

        await page.render(renderContext).promise;
        if (currentAnnotatePageSpan) currentAnnotatePageSpan.textContent = num;

        updateVisibleMarkers();
    }

    function updateVisibleMarkers() {
        if (!annotationsOverlay) return;
        annotationsOverlay.innerHTML = '';
        annotateState.annotations.forEach((ann, index) => {
            if (ann.page === annotateState.pageNum - 1) {
                renderVisualMarker(ann.uiX, ann.uiY, index + 1, ann.text);
            }
        });
    }

    function renderVisualMarker(x, y, number, text) {
        const markerContainer = document.createElement('div');
        markerContainer.className = 'annotation-container';
        markerContainer.style.position = 'absolute';
        markerContainer.style.left = `${x}px`;
        markerContainer.style.top = `${y}px`;
        markerContainer.style.zIndex = '100';
        markerContainer.style.pointerEvents = 'auto';

        const marker = document.createElement('div');
        marker.className = 'annotation-marker';
        marker.style.width = '24px';
        marker.style.height = '24px';
        marker.style.background = 'var(--itb-secondary)';
        marker.style.color = 'white';
        marker.style.borderRadius = '50% 50% 50% 0';
        marker.style.display = 'flex';
        marker.style.alignItems = 'center';
        marker.style.justifyContent = 'center';
        marker.style.fontSize = '10px';
        marker.style.fontWeight = 'bold';
        marker.style.transform = 'translate(-50%, -100%)';
        marker.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        marker.style.cursor = 'pointer';
        marker.innerText = number;

        const tooltip = document.createElement('div');
        tooltip.className = 'annotation-tooltip';
        tooltip.innerText = text;
        tooltip.style.position = 'absolute';
        tooltip.style.bottom = '30px';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.background = 'rgba(44, 62, 80, 0.95)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '6px';
        tooltip.style.fontSize = '12px';
        tooltip.style.whiteSpace = 'normal';
        tooltip.style.width = 'max-content';
        tooltip.style.maxWidth = '200px';
        tooltip.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
        tooltip.style.transition = 'opacity 0.2s, transform 0.2s, visibility 0.2s';
        tooltip.style.zIndex = '101';

        markerContainer.appendChild(marker);
        markerContainer.appendChild(tooltip);

        markerContainer.onmouseenter = () => {
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateX(-50%) translateY(-5px)';
        };
        markerContainer.onmouseleave = () => {
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
            tooltip.style.transform = 'translateX(-50%)';
        };

        annotationsOverlay.appendChild(markerContainer);
    }

    function handleCanvasClick(e) {
        if (!pdfCanvas || !floatingNoteForm || !noteText) return;
        const rect = pdfCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        annotateState.currentClick = { x, y };

        floatingNoteForm.style.left = `${x}px`;
        floatingNoteForm.style.top = `${y}px`;
        floatingNoteForm.style.display = 'block';
        noteText.value = '';
        noteText.focus();
    }

    async function saveNote() {
        if (!noteText || !annotateState.pdfDoc || !pdfCanvas) return;
        const text = noteText.value.trim();
        if (!text) {
            hideNoteForm();
            return;
        }

        const page = await annotateState.pdfDoc.getPage(annotateState.pageNum);
        const viewport = page.getViewport({ scale: 1.0 });

        const scaleX = viewport.width / pdfCanvas.width;
        const scaleY = viewport.height / pdfCanvas.height;

        const ann = {
            x: annotateState.currentClick.x * scaleX,
            y: viewport.height - (annotateState.currentClick.y * scaleY),
            text: text,
            type: 'note',
            page: annotateState.pageNum - 1,
            uiX: annotateState.currentClick.x,
            uiY: annotateState.currentClick.y
        };

        annotateState.annotations.push(ann);
        updateVisibleMarkers();
        hideNoteForm();
    }

    function hideNoteForm() {
        if (floatingNoteForm) floatingNoteForm.style.display = 'none';
        if (noteText) noteText.value = '';
    }

    async function submitAnnotations() {
        if (annotateState.annotations.length === 0) {
            if (typeof window.showError === 'function') window.showError('Añade al menos una anotación antes de guardar.');
            return;
        }

        const submitBtn = document.getElementById('saveAndSendAnnotateBtn');
        const originalText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        }

        try {
            const payload = {
                file_id: parseInt(annotateState.versionId),
                annotations: annotateState.annotations.map(({ x, y, text, type, page }) => ({ x, y, text, type, page }))
            };

            const response = await fetch(`${API_URL}/api/v1/annotations/annotate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.getToken()}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                annotateState.annotatedVersionId = data.annotated_version_id;
                closeAnnotateModal();
                if (typeof window.showSuccess === 'function') window.showSuccess('Anotaciones guardadas correctamente');
                if (typeof window.loadHistory === 'function') await window.loadHistory();
            } else {
                throw new Error(data.detail || 'Error al guardar anotaciones');
            }
        } catch (error) {
            if (typeof window.showError === 'function') window.showError(error.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    }

    function closeAnnotateModal() {
        if (annotateModal) annotateModal.style.display = 'none';
        hideNoteForm();
        if (annotateState.pdfDoc) {
            annotateState.pdfDoc.destroy();
            annotateState.pdfDoc = null;
        }
    }

    // Registrar botones de paginación y modales
    const prevBtn = document.getElementById('prevPageBtn');
    if (prevBtn) {
        prevBtn.onclick = () => {
            if (annotateState.pageNum <= 1) return;
            annotateState.pageNum--;
            renderAnnotatePage(annotateState.pageNum);
        };
    }

    const nextBtn = document.getElementById('nextPageBtn');
    if (nextBtn) {
        nextBtn.onclick = () => {
            if (!annotateState.pdfDoc || annotateState.pageNum >= annotateState.pdfDoc.numPages) return;
            annotateState.pageNum++;
            renderAnnotatePage(annotateState.pageNum);
        };
    }

    const closeAnn = document.querySelector('.close-modal-annotate');
    if (closeAnn) closeAnn.onclick = closeAnnotateModal;

    const closeAnnBtn = document.querySelector('.close-modal-annotate-btn');
    if (closeAnnBtn) closeAnnBtn.onclick = closeAnnotateModal;

    const canvasWrapper = document.getElementById('pdfCanvasWrapper');
    if (canvasWrapper) canvasWrapper.onclick = handleCanvasClick;

    const sNote = document.getElementById('saveNote');
    if (sNote) sNote.onclick = saveNote;

    const cNote = document.getElementById('cancelNote');
    if (cNote) cNote.onclick = hideNoteForm;

    const sAnnotate = document.getElementById('saveAndSendAnnotateBtn');
    if (sAnnotate) sAnnotate.onclick = submitAnnotations;

    // --- ACCIONES DOCUMENTALES GENERALES ---

    async function downloadCloudFile(versionId) {
        try {
            const response = await fetch(`${API_URL}/api/v1/files/download/${versionId}`, {
                headers: { 'Authorization': `Bearer ${window.getToken()}` }
            });

            if (!response.ok) throw new Error('No se pudo descargar el archivo');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'documento.pdf';

            if (contentDisposition) {
                const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
                const filenameQuoteMatch = contentDisposition.match(/filename="([^"]+)"/i);
                const filenameSimpleMatch = contentDisposition.match(/filename=([^; ]+)/i);

                if (filenameStarMatch && filenameStarMatch[1]) {
                    filename = decodeURIComponent(filenameStarMatch[1]);
                } else if (filenameQuoteMatch && filenameQuoteMatch[1]) {
                    filename = filenameQuoteMatch[1];
                } else if (filenameSimpleMatch && filenameSimpleMatch[1]) {
                    filename = filenameSimpleMatch[1];
                }
            } else {
                const contentType = response.headers.get('content-type');
                if (contentType) {
                    if (contentType.includes('word')) filename = 'documento.docx';
                    else if (contentType.includes('sheet')) filename = 'documento.xlsx';
                    else if (contentType.includes('presentation')) filename = 'documento.pptx';
                }
            }

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (typeof window.showSuccess === 'function') {
                window.showSuccess('Descargando archivo desde el servidor...');
            }

            setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        } catch (error) {
            if (typeof window.showError === 'function') window.showError(error.message);
        }
    }

    async function deleteCloudDocument(docId) {
        try {
            const response = await fetch(`${API_URL}/api/v1/files/${docId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${window.getToken()}` }
            });

            if (!response.ok) throw new Error('No se pudo eliminar el documento');

            if (typeof window.showSuccess === 'function') {
                window.showSuccess('Documento eliminado correctamente');
            }
            if (typeof window.loadHistory === 'function') {
                await window.loadHistory();
            }
        } catch (error) {
            if (typeof window.showError === 'function') window.showError(error.message);
        }
    }

    // Eliminar local/historial local
    function deleteFromHistory(type, index) {
        if (confirm('¿Estás seguro de que deseas eliminar este archivo del historial?')) {
            if (type === 'conversion') {
                if (window.conversionHistory && window.conversionHistory[index] && window.conversionHistory[index].pdfUrl) {
                    URL.revokeObjectURL(window.conversionHistory[index].pdfUrl);
                }
                if (Array.isArray(window.conversionHistory)) {
                    window.conversionHistory.splice(index, 1);
                }
            } else if (type === 'uploaded') {
                if (Array.isArray(window.uploadedFiles)) {
                    window.uploadedFiles.splice(index, 1);
                }
            }

            if (typeof window.saveToLocalStorage === 'function') {
                window.saveToLocalStorage();
            }
            if (typeof window.loadHistory === 'function') {
                window.loadHistory();
            }
            if (typeof window.showSuccess === 'function') {
                window.showSuccess('Elemento eliminado del historial');
            }
        }
    }

    function downloadFromHistory(index) {
        if (Array.isArray(window.conversionHistory) && window.conversionHistory[index]) {
            const item = window.conversionHistory[index];
            if (item && item.pdfUrl) {
                const link = document.createElement('a');
                link.href = item.pdfUrl;
                link.download = item.pdfName;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                if (typeof window.showSuccess === 'function') {
                    window.showSuccess(`PDF descargado: ${item.pdfName}`);
                }
            } else {
                if (typeof window.showError === 'function') window.showError('El PDF no está disponible para descarga.');
            }
        }
    }

    // --- VINCULACIÓN EVENTOS DINÁMICOS DEL DOM (ROW ACTIONS) ---

    function attachSharedEvents() {
        console.log('🔗 [History] Vinculando manejadores de eventos dinámicos');

        // Descarga de archivos
        document.querySelectorAll('.download-cloud-btn').forEach(btn => {
            btn.onclick = async function () {
                const versionId = this.getAttribute('data-id');
                if (versionId) await downloadCloudFile(versionId);
            };
        });

        // Carga de nuevas versiones
        document.querySelectorAll('.upload-version-btn').forEach(btn => {
            btn.onclick = function () {
                const docId = this.getAttribute('data-id');
                window.currentParentId = docId;
                if (typeof window.showUploadSection === 'function') {
                    window.showUploadSection();
                }
                if (typeof window.showSuccess === 'function') {
                    window.showSuccess(`Preparado para subir nueva versión del documento #${docId}`);
                }
            };
        });

        // Eliminación física
        document.querySelectorAll('.delete-cloud-btn').forEach(btn => {
            btn.onclick = async function () {
                if (this.disabled) return;
                const docId = this.getAttribute('data-id');
                if (confirm('¿Estás seguro de que deseas eliminar este documento y todas sus versiones?')) {
                    await deleteCloudDocument(docId);
                }
            };
        });

        // Compartir por correo
        document.querySelectorAll('.share-doc-btn').forEach(btn => {
            btn.onclick = function () {
                const docId = this.getAttribute('data-id');
                const docName = this.getAttribute('data-name');
                const versionId = this.getAttribute('data-version-id');
                openShareModal(docId, docName, versionId);
            };
        });

        // Firmar digitalmente
        document.querySelectorAll('.sign-doc-btn').forEach(btn => {
            btn.onclick = function () {
                const docId = this.getAttribute('data-id');
                const docName = this.getAttribute('data-name');
                openSignModal(docId, docName);
            };
        });

        // Anotar PDF
        document.querySelectorAll('.annotate-doc-btn').forEach(btn => {
            btn.onclick = function () {
                const versionId = this.getAttribute('data-version-id');
                const docName = this.getAttribute('data-name');
                openAnnotateModal(versionId, docName);
            };
        });

        // Descarga de locales
        document.querySelectorAll('.download-pdf-btn').forEach(btn => {
            btn.onclick = function () {
                const index = parseInt(this.getAttribute('data-index'));
                downloadFromHistory(index);
            };
        });

        // Eliminación de locales
        document.querySelectorAll('.delete-history-btn').forEach(btn => {
            btn.onclick = function () {
                const index = parseInt(this.getAttribute('data-index'));
                deleteFromHistory('conversion', index);
            };
        });
    }

    // Limpieza de historial completo (botón limpiar historial)
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', async function () {
            if (!confirm('¿Estás seguro de que deseas eliminar todo el historial?')) return;

            const isAuth = typeof window.isAuthenticated === 'function' ? window.isAuthenticated() : false;
            if (!isAuth) {
                if (Array.isArray(window.conversionHistory)) {
                    window.conversionHistory.forEach(item => {
                        if (item.pdfUrl) URL.revokeObjectURL(item.pdfUrl);
                    });
                }
                window.conversionHistory = [];
                window.uploadedFiles = [];
                if (typeof window.saveToLocalStorage === 'function') window.saveToLocalStorage();
                if (typeof window.loadHistory === 'function') window.loadHistory();
                if (typeof window.showSuccess === 'function') window.showSuccess('Historial eliminado correctamente (local)');
                return;
            }

            try {
                const res = await fetch(`${API_URL}/api/v1/files/my-documents`, {
                    headers: { 'Authorization': `Bearer ${window.getToken()}` }
                });

                if (res.status === 401 && typeof window.logout === 'function') {
                    window.logout();
                    return;
                }

                if (!res.ok) throw new Error('No se pudo obtener la lista de documentos');

                const docs = await res.json();
                const owned = docs.filter(d => d.is_owner).map(d => d.id);

                if (owned.length === 0) {
                    if (Array.isArray(window.conversionHistory)) {
                        window.conversionHistory.forEach(item => { if (item.pdfUrl) URL.revokeObjectURL(item.pdfUrl); });
                    }
                    window.conversionHistory = [];
                    window.uploadedFiles = [];
                    if (typeof window.saveToLocalStorage === 'function') window.saveToLocalStorage();
                    if (typeof window.loadHistory === 'function') window.loadHistory();
                    if (typeof window.showSuccess === 'function') {
                        window.showSuccess('No se encontraron documentos en la nube. Historial local limpiado.');
                    }
                    return;
                }

                let deleted = 0;
                let failed = 0;
                for (const id of owned) {
                    try {
                        const r = await fetch(`${API_URL}/api/v1/files/${id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${window.getToken()}` }
                        });
                        if (r.ok) deleted += 1; else failed += 1;
                    } catch (err) {
                        console.error('Error eliminando documento', id, err);
                        failed += 1;
                    }
                }

                if (Array.isArray(window.conversionHistory)) {
                    window.conversionHistory.forEach(item => { if (item.pdfUrl) URL.revokeObjectURL(item.pdfUrl); });
                }
                window.conversionHistory = [];
                window.uploadedFiles = [];
                if (typeof window.saveToLocalStorage === 'function') window.saveToLocalStorage();
                if (typeof window.loadHistory === 'function') await window.loadHistory();

                if (typeof window.showSuccess === 'function') {
                    if (failed === 0) window.showSuccess(`Se eliminaron ${deleted} documentos en la nube y se limpió el historial local.`);
                    else window.showSuccess(`Eliminados ${deleted} documentos; ${failed} no pudieron eliminarse.`);
                }
            } catch (error) {
                console.error('Error al limpiar historial en la nube:', error);
                if (typeof window.showError === 'function') {
                    window.showError('No se pudo eliminar el historial en la nube. Intenta nuevamente.');
                }
            }
        });
    }

    // Exponer las funciones globalmente para que puedan ser accedidas por los renderizadores del dashboard
    window.attachSharedEvents = attachSharedEvents;
    window.openSignModal = openSignModal;
    window.openShareModal = openShareModal;
    window.openAnnotateModal = openAnnotateModal;
    window.downloadCloudFile = downloadCloudFile;
    window.deleteCloudDocument = deleteCloudDocument;
});
