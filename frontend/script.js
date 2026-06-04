/**
 * Script Principal Coordinador del Dashboard - VERSIÓN MODULAR
 */

const API_URL = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || "http://localhost:8000";

// Exponer variables de estado globalmente para acceso entre módulos
window.currentFile = null;
window.currentParentId = null; // Para control de versiones
window.conversionHistory = [];
window.uploadedFiles = []; // Almacenamiento local

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Dashboard del Conversor - Inicialización General');

    // Verificar autenticación
    if (typeof initializeAuth === 'function') {
        initializeAuth();
    }

    // Mostrar mensaje de logout si existe
    if (typeof getLogoutMessage === 'function') {
        const logoutMsg = getLogoutMessage();
        if (logoutMsg) {
            setTimeout(() => {
                const alertDiv = document.createElement('div');
                alertDiv.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background-color: #fff3cd;
                    color: #856404;
                    padding: 15px 20px;
                    border-radius: 4px;
                    border: 1px solid #ffeeba;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                `;
                alertDiv.innerHTML = `
                    <i class="fas fa-info-circle"></i>
                    <span>${logoutMsg}</span>
                `;
                document.body.appendChild(alertDiv);
                
                setTimeout(() => {
                    alertDiv.remove();
                }, 5000);
            }, 500);
        }
    }

    // Elementos del DOM del Core y Navegación
    const uploadBtn = document.getElementById('uploadBtn');
    const historyBtn = document.getElementById('historyBtn');
    const sharedBtn = document.getElementById('sharedBtn');
    const validateBtn = document.getElementById('validateBtn');

    const uploadSection = document.getElementById('uploadSection');
    const historySection = document.getElementById('historySection');
    const sharedSection = document.getElementById('sharedSection');
    const validateSection = document.getElementById('validateSection');

    const historyFiles = document.getElementById('historyFiles');
    const sharedFiles = document.getElementById('sharedFiles');

    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const clearSharedBtn = document.getElementById('clearSharedBtn');
    const convertBtn = document.getElementById('convertBtn');
    const conversionOptions = document.getElementById('conversionOptions');

    // Cargar datos locales
    loadFromLocalStorage();

    // Configuración de navegación
    if (uploadBtn && historyBtn) {
        uploadBtn.addEventListener('click', () => showUploadSection());
        historyBtn.addEventListener('click', () => showHistorySection());
        if (sharedBtn) sharedBtn.addEventListener('click', () => showSharedSection());
        if (validateBtn) validateBtn.addEventListener('click', () => showValidateSection());
    }

    // --- FUNCIONES DE NAVEGACIÓN ---

    function showUploadSection() {
        if (uploadSection) uploadSection.style.display = 'block';
        if (historySection) historySection.style.display = 'none';
        if (sharedSection) sharedSection.style.display = 'none';
        if (validateSection) validateSection.style.display = 'none';

        if (conversionOptions) conversionOptions.style.display = 'block';
        if (convertBtn) convertBtn.style.display = 'block';
        if (clearHistoryBtn) clearHistoryBtn.style.display = 'none';
        if (clearSharedBtn) clearSharedBtn.style.display = 'none';

        if (uploadBtn) uploadBtn.classList.add('active');
        if (historyBtn) historyBtn.classList.remove('active');
        if (sharedBtn) sharedBtn.classList.remove('active');
        if (validateBtn) validateBtn.classList.remove('active');

        hideMessages();
        localStorage.setItem('activeModule', 'upload');
    }

    function showHistorySection() {
        if (uploadSection) uploadSection.style.display = 'none';
        if (historySection) historySection.style.display = 'block';
        if (sharedSection) sharedSection.style.display = 'none';
        if (validateSection) validateSection.style.display = 'none';

        if (conversionOptions) conversionOptions.style.display = 'none';
        if (convertBtn) convertBtn.style.display = 'none';
        if (clearHistoryBtn) clearHistoryBtn.style.display = 'block';
        if (clearSharedBtn) clearSharedBtn.style.display = 'none';

        if (uploadBtn) uploadBtn.classList.remove('active');
        if (historyBtn) historyBtn.classList.add('active');
        if (sharedBtn) sharedBtn.classList.remove('active');
        if (validateBtn) validateBtn.classList.remove('active');

        loadHistory();
        localStorage.setItem('activeModule', 'history');
    }

    function showSharedSection() {
        if (uploadSection) uploadSection.style.setProperty('display', 'none', 'important');
        if (historySection) historySection.style.setProperty('display', 'none', 'important');
        if (sharedSection) sharedSection.style.setProperty('display', 'block', 'important');
        if (validateSection) validateSection.style.setProperty('display', 'none', 'important');

        if (conversionOptions) conversionOptions.style.display = 'none';
        if (convertBtn) convertBtn.style.display = 'none';
        if (clearHistoryBtn) clearHistoryBtn.style.display = 'none';
        if (clearSharedBtn) clearSharedBtn.style.display = 'block';

        if (uploadBtn) uploadBtn.classList.remove('active');
        if (historyBtn) historyBtn.classList.remove('active');
        if (sharedBtn) sharedBtn.classList.add('active');
        if (validateBtn) validateBtn.classList.remove('active');

        hideMessages();
        loadDocuments();
        localStorage.setItem('activeModule', 'shared');
    }

    function showValidateSection() {
        if (uploadSection) uploadSection.style.display = 'none';
        if (historySection) historySection.style.display = 'none';
        if (sharedSection) sharedSection.style.display = 'none';
        if (validateSection) validateSection.style.display = 'block';

        if (conversionOptions) conversionOptions.style.display = 'none';
        if (convertBtn) convertBtn.style.display = 'none';
        if (clearHistoryBtn) clearHistoryBtn.style.display = 'none';
        if (clearSharedBtn) clearSharedBtn.style.display = 'none';

        if (uploadBtn) uploadBtn.classList.remove('active');
        if (historyBtn) historyBtn.classList.remove('active');
        if (sharedBtn) sharedBtn.classList.remove('active');
        if (validateBtn) validateBtn.classList.add('active');

        hideMessages();
        localStorage.setItem('activeModule', 'validate');
    }

    // --- ALMACENAMIENTO LOCAL ---

    function loadFromLocalStorage() {
        try {
            const savedHistory = localStorage.getItem('conversionHistory');
            const savedUploads = localStorage.getItem('uploadedFiles');

            if (savedHistory) window.conversionHistory = JSON.parse(savedHistory);
            if (savedUploads) window.uploadedFiles = JSON.parse(savedUploads);
        } catch (error) {
            console.error('Error al cargar datos locales:', error);
            window.conversionHistory = [];
            window.uploadedFiles = [];
        }
    }

    function saveToLocalStorage() {
        try {
            localStorage.setItem('conversionHistory', JSON.stringify(window.conversionHistory));
            localStorage.setItem('uploadedFiles', JSON.stringify(window.uploadedFiles));
        } catch (error) {
            console.error('Error al guardar datos locales:', error);
        }
    }

    // --- CARGA DE DOCUMENTOS (API / LOCAL) ---

    async function loadHistory() {
        await loadDocuments();
    }

    async function loadDocuments() {
        if (!historyFiles) return;

        let historyHTML = '';
        let sharedHTML = '';
        let backendDocs = [];

        console.log('🔄 [Dashboard] Cargando y sincronizando documentos...');

        const loadingSpinner = `
            <div style="text-align: center; padding: 30px;">
                <i class="fas fa-spinner fa-spin fa-3x" style="color: var(--itb-secondary); margin-bottom: 15px;"></i>
                <p>Cargando lista...</p>
            </div>`;

        if (historySection && historySection.style.display !== 'none') historyFiles.innerHTML = loadingSpinner;
        if (sharedSection && sharedSection.style.display !== 'none' && sharedFiles) sharedFiles.innerHTML = loadingSpinner;

        const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : false;
        if (isAuth) {
            try {
                const response = await fetch(`${API_URL}/api/v1/files/my-documents`, {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                if (response.status === 401 && typeof logout === 'function') {
                    logout();
                    return;
                }
                if (response.ok) {
                    backendDocs = await response.json();
                }
            } catch (error) {
                console.error('❌ Error al obtener documentos de la API:', error);
            }
        }

        // Filtrar conversiones puramente locales
        const localHistoryToShow = window.conversionHistory.filter(item =>
            !backendDocs.some(doc =>
                doc.name === item.originalName ||
                doc.name === item.pdfName ||
                doc.name === item.originalName.replace(/\.[^/.]+$/, "") + ".pdf"
            )
        );

        // Renderizado del historial propio
        const ownedDocs = backendDocs.filter(d => d.is_owner);

        if (ownedDocs.length > 0) {
            historyHTML += `<h3 style="margin: 20px 0 10px; color: var(--itb-primary);">Mis Documentos</h3>`;
            ownedDocs.forEach(doc => historyHTML += generateDocumentHTML(doc));
        }

        if (localHistoryToShow.length > 0) {
            historyHTML += `<h3 style="margin: 30px 0 10px; color: var(--itb-primary);">Conversiones locales</h3>`;
            localHistoryToShow.forEach(item => {
                const actualIndex = window.conversionHistory.findIndex(h => h.id === item.id);
                const iconClass = getFileIconClass(item.originalType);
                historyHTML += `
                    <div class="history-item">
                        <div class="history-file-info">
                            <i class="fas ${iconClass} history-file-icon" style="color: ${getFileIconColor(item.originalType)}"></i>
                            <div class="history-file-details">
                                <h4>${item.originalName} → PDF</h4>
                            </div>
                        </div>
                        <div class="history-file-actions">
                            <button class="btn download-pdf-btn" data-index="${actualIndex}"><i class="fas fa-download"></i></button>
                            <button class="btn-secondary delete-history-btn" data-index="${actualIndex}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`;
            });
        }

        historyFiles.innerHTML = historyHTML || `
            <div class="no-history">
                <i class="fas fa-history fa-3x" style="color: var(--itb-gray); margin-bottom: 20px;"></i>
                <p>No hay archivos en tu historial</p>
                <p style="font-size: 0.9rem; color: var(--itb-gray);">Convierte archivos para verlos aquí</p>
            </div>`;

        // Renderizado de compartidos
        const sharedDocs = backendDocs.filter(d => !d.is_owner);

        if (sharedDocs.length > 0) {
            sharedHTML += `<h3 style="margin: 20px 0 10px; color: var(--itb-primary);">Documentos Compartidos</h3>`;
            sharedDocs.forEach(doc => sharedHTML += generateDocumentHTML(doc));
        }

        if (sharedFiles) {
            sharedFiles.innerHTML = sharedHTML || `
                <div class="no-history">
                    <i class="fas fa-folder-open fa-3x" style="color: var(--itb-gray); margin-bottom: 20px;"></i>
                    <p>No tienes documentos compartidos</p>
                    <p style="font-size: 0.9rem; color: var(--itb-gray);">Los archivos que otros compartan contigo aparecerán aquí</p>
                </div>`;
        }

        // Delegar la vinculación de los eventos de clic a los botones generados al módulo de historial
        if (typeof window.attachSharedEvents === 'function') {
            window.attachSharedEvents();
        }
    }

    // Generar bloque HTML para cada documento
    function generateDocumentHTML(doc) {
        const v = doc.latest_version;
        const fileExt = doc.name.split('.').pop().toLowerCase();
        const iconClass = getFileIconClass(fileExt);
        const permission = doc.permission || (doc.is_owner ? 'owner' : 'viewer');
        const isOwner = permission === 'owner';
        const canUpdate = isOwner || permission === 'editor';
        const isShared = !isOwner || doc.shared_with_others;

        let versionNumber = '1.0';
        if (v && v.version_number) {
            versionNumber = v.version_number.toString().replace(/^[vV]/, '');
        }

        const versionBadge = `<span class="badge" style="background: #3498db; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin-right: 5px; font-weight: normal; display: inline-block; line-height: 1;">v${versionNumber}</span>`;

        const sharedBadge = isShared ?
            '<span class="badge" style="background: #e67e22; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin-left: 5px; font-weight: normal; display: inline-block; line-height: 1;">Compartido</span>' : '';

        const externalBadge = doc.shared_externally ?
            '<span class="badge" title="Enviado por correo externo" style="background: #27ae60; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; margin-left: 5px; font-weight: normal; display: inline-block; line-height: 1;">✉️</span>' : '';

        const roleLabel = isOwner ? 'Propietario' : (permission === 'editor' ? 'Editor' : 'Lector');

        const fileSize = v && v.file_size ? formatFileSize(v.file_size) : 'N/A';
        const uploadDate = v && v.created_at ? new Date(v.created_at).toLocaleDateString('es-ES') : 'N/A';

        return `
            <div class="history-item">
                <div class="history-file-info">
                    <i class="fas ${iconClass} history-file-icon" style="color: ${getFileIconColor(fileExt)}"></i>
                    <div class="history-file-details">
                        <h4 style="margin-bottom: 8px; display: flex; align-items: center; gap: 5px;">
                            ${doc.name} ${versionBadge} ${sharedBadge} ${externalBadge}
                        </h4>
                        <div class="history-file-meta">
                            <span><i class="fas fa-calendar-alt"></i> ${uploadDate}</span>
                            <span><i class="fas fa-weight-hanging"></i> ${fileSize}</span>
                            <span><i class="fas fa-user-tag"></i> ${roleLabel}</span>
                        </div>
                    </div>
                </div>
                <div class="history-file-actions">
                    <button class="btn download-cloud-btn" data-id="${v ? v.id : ''}" title="Descargar">
                        <i class="fas fa-download"></i>
                    </button>
                    ${fileExt.toLowerCase() === 'pdf' ?
                `<button class="btn-secondary sign-doc-btn" data-id="${doc.id}" data-name="${doc.name}" title="Firmar">
                            <i class="fas fa-pen-nib"></i>
                        </button>
                        <button class="btn-secondary annotate-doc-btn" data-version-id="${v ? v.id : ''}" data-name="${doc.name}" title="Anotar">
                            <i class="fas fa-pencil-alt"></i>
                        </button>` : ''}
                    ${isOwner ?
                `<button class="btn-secondary share-doc-btn" data-id="${doc.id}" data-version-id="${v ? v.id : ''}" data-name="${doc.name}" title="Enviar por Correo">
                            <i class="fas fa-paper-plane"></i>
                        </button>` : ''}
                    <button class="btn-secondary upload-version-btn" data-id="${doc.id}" title="Nueva Versión" 
                            style="${canUpdate ? '' : 'display: none;'}">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn-secondary delete-cloud-btn" data-id="${doc.id}" title="Eliminar" 
                            ${!isOwner ? 'disabled style="opacity: 0.5;"' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
    }

    // --- MODALES DE NOTIFICACIÓN DE ESTADO ---

    const statusOverlay = document.getElementById('statusOverlay');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const downloadLinkContainer = document.getElementById('downloadLinkContainer');
    const closeSuccess = document.getElementById('closeSuccess');
    const closeError = document.getElementById('closeError');
    const closeErrorBtn = document.getElementById('closeErrorBtn');

    function closeStatusModals() {
        if (statusOverlay) statusOverlay.style.display = 'none';
        if (successMessage) {
            successMessage.style.display = 'none';
            successMessage.classList.remove('show');
        }
        if (errorMessage) {
            errorMessage.style.display = 'none';
            errorMessage.classList.remove('show');
        }
    }

    if (closeSuccess) closeSuccess.addEventListener('click', closeStatusModals);
    if (closeError) closeError.addEventListener('click', closeStatusModals);
    if (closeErrorBtn) closeErrorBtn.addEventListener('click', closeStatusModals);
    if (statusOverlay) {
        statusOverlay.addEventListener('click', function (e) {
            if (e.target === statusOverlay) closeStatusModals();
        });
    }

    function showSuccess(message = '¡Operación completada!') {
        if (successMessage) {
            const successTitle = document.getElementById('successTitle');
            const successText = document.getElementById('successMessageText');

            if (message.includes('eliminado')) {
                if (successTitle) successTitle.innerHTML = message;
                if (successText) successText.innerHTML = '';
            } else if (message.includes('convertido')) {
                if (successTitle) successTitle.innerHTML = '¡Conversión completada!';
                if (successText) successText.innerHTML = message;
            } else {
                if (successTitle) successTitle.innerHTML = '¡Éxito!';
                if (successText) successText.innerHTML = message;
            }

            if (downloadLinkContainer) {
                downloadLinkContainer.style.display = message.includes('convertido') ? 'block' : 'none';
            }

            if (statusOverlay) statusOverlay.style.display = 'flex';
            successMessage.style.display = 'flex';
            successMessage.classList.add('show');

            if (errorMessage) {
                errorMessage.style.display = 'none';
                errorMessage.classList.remove('show');
            }

            setTimeout(() => {
                if (successMessage.classList.contains('show')) {
                    closeStatusModals();
                }
            }, 6000);
        }
    }

    function showError(message) {
        if (errorMessage) {
            const errorTitle = document.getElementById('errorTitle');
            const errorText = document.getElementById('errorMessageText');

            if (errorTitle) errorTitle.innerHTML = 'Ocurrió un problema';
            if (errorText) errorText.textContent = message;

            if (statusOverlay) statusOverlay.style.display = 'flex';
            errorMessage.style.display = 'flex';
            errorMessage.classList.add('show');

            if (successMessage) {
                successMessage.style.display = 'none';
                successMessage.classList.remove('show');
            }
        }
    }

    function hideMessages() {
        closeStatusModals();
    }

    // --- AUXILIARES COMUNES ---

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function getFileIconClass(fileType) {
        const type = fileType.toLowerCase();
        if (type.includes('word') || type.includes('doc')) return 'fa-file-word';
        if (type.includes('excel') || type.includes('xls')) return 'fa-file-excel';
        if (type.includes('powerpoint') || type.includes('ppt')) return 'fa-file-powerpoint';
        if (type.includes('pdf')) return 'fa-file-pdf';
        if (type.includes('text') || type.includes('txt') || type.includes('rtf')) return 'fa-file-alt';
        return 'fa-file';
    }

    function getFileIconColor(fileType) {
        const type = fileType.toLowerCase();
        if (type.includes('word') || type.includes('doc')) return '#2B579A';
        if (type.includes('excel') || type.includes('xls')) return '#217346';
        if (type.includes('powerpoint') || type.includes('ppt')) return '#D24726';
        if (type.includes('pdf')) return '#F40F02';
        return '#666666';
    }

    function getFileTypeName(fileType) {
        const type = fileType.toLowerCase();
        if (type.includes('word') || type.includes('doc')) return 'Documento Word';
        if (type.includes('excel') || type.includes('xls')) return 'Hoja de cálculo Excel';
        if (type.includes('powerpoint') || type.includes('ppt')) return 'Presentación PowerPoint';
        if (type.includes('pdf')) return 'Documento PDF';
        if (type.includes('txt')) return 'Documento de Texto';
        if (type.includes('rtf')) return 'Documento RTF';
        return 'Documento';
    }

    // --- GESTIÓN DE USUARIOS (ADMINISTRADOR - S8) ---

    const usersAdminDropdownBtn = document.getElementById('usersAdminDropdownBtn');
    const adminDivider = document.getElementById('adminDivider');
    const adminUsersModal = document.getElementById('adminUsersModal');
    const adminUsersTableBody = document.getElementById('adminUsersTableBody');

    const deleteUserModal = document.getElementById('deleteUserModal');
    const changeRoleModal = document.getElementById('changeRoleModal');
    
    let currentUserIdToDelete = null;
    let currentUserToChangeRole = null;
    let newRoleToSet = null;

    const currentUser = typeof getUserData === 'function' ? getUserData() : null;
    if (currentUser && currentUser.role === 'admin' && usersAdminDropdownBtn) {
        usersAdminDropdownBtn.style.display = 'block';
        if (adminDivider) adminDivider.style.display = 'block';
    }

    if (usersAdminDropdownBtn) {
        usersAdminDropdownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const dropdownMenu = document.getElementById('userDropdownMenu');
            const dropdownBtn = document.getElementById('userDropdownBtn');
            if (dropdownMenu) dropdownMenu.classList.remove('show');
            if (dropdownBtn) dropdownBtn.classList.remove('active');
            
            showAdminUsersSection();
        });
    }

    const closeAdminUsersModalBtns = document.querySelectorAll('.close-modal-admin-users');
    closeAdminUsersModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (adminUsersModal) adminUsersModal.style.display = 'none';
        });
    });

    window.addEventListener('click', function(event) {
        if (event.target === adminUsersModal) {
            adminUsersModal.style.display = 'none';
        }
    });

    function showAdminUsersSection() {
        if (adminUsersModal) adminUsersModal.style.display = 'block';
        loadAdminUsers();
    }

    async function loadAdminUsers() {
        if (!adminUsersTableBody) return;
        adminUsersTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Cargando usuarios...</td></tr>`;

        try {
            const response = await fetch(`${API_URL}/api/v1/auth/users`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error("No tienes permisos de administrador para ver esta sección.");
                }
                throw new Error("Error al cargar la lista de usuarios.");
            }

            const users = await response.json();
            renderUsersTable(users);
        } catch (error) {
            console.error(error);
            adminUsersTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--itb-accent); padding: 20px;"><i class="fas fa-exclamation-triangle"></i> ${error.message}</td></tr>`;
        }
    }

    function renderUsersTable(users) {
        if (users.length === 0) {
            adminUsersTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px;">No hay usuarios registrados.</td></tr>`;
            return;
        }

        let html = '';
        users.forEach(user => {
            const isMe = currentUser && currentUser.email === user.email;
            const statusBadge = user.is_active ? 
                `<span class="badge badge-active">Activo</span>` : 
                `<span class="badge badge-inactive">Inactivo</span>`;
            
            const roleSelect = `
                <select class="role-select" data-id="${user.id}" data-email="${user.email}" ${isMe ? 'disabled title="No puedes cambiar tu propio rol"' : ''}>
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>Usuario</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                </select>
            `;

            const deleteBtn = `
                <button class="action-btn-delete" data-id="${user.id}" data-email="${user.email}" ${isMe ? 'disabled title="No puedes eliminarte a ti mismo" style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    <i class="fas fa-trash-alt"></i> Eliminar
                </button>
            `;

            html += `
                <tr>
                    <td><strong>${user.email}</strong> ${isMe ? '<span class="badge" style="background:#3498db;color:white;">Tú</span>' : ''}</td>
                    <td>${roleSelect}</td>
                    <td>${statusBadge}</td>
                    <td>${deleteBtn}</td>
                </tr>
            `;
        });

        adminUsersTableBody.innerHTML = html;

        document.querySelectorAll('.role-select').forEach(select => {
            select.addEventListener('change', function() {
                const userId = this.getAttribute('data-id');
                const email = this.getAttribute('data-email');
                const newRole = this.value;
                const newRoleText = this.options[this.selectedIndex].text;
                
                this.value = newRole === 'admin' ? 'user' : 'admin'; 

                currentUserToChangeRole = { id: userId, email: email, selectElement: this };
                newRoleToSet = newRole;

                document.getElementById('changeRoleEmail').textContent = email;
                document.getElementById('changeRoleNewText').textContent = newRoleText;
                changeRoleModal.style.display = 'block';
            });
        });

        document.querySelectorAll('.action-btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                if (this.disabled) return;
                currentUserIdToDelete = this.getAttribute('data-id');
                const email = this.getAttribute('data-email');
                
                document.getElementById('deleteUserEmail').textContent = email;
                deleteUserModal.style.display = 'block';
            });
        });
    }

    const closeDeleteUserModalBtns = document.querySelectorAll('.close-modal-delete-user, .close-modal-delete-user-btn');
    closeDeleteUserModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (deleteUserModal) deleteUserModal.style.display = 'none';
            currentUserIdToDelete = null;
        });
    });

    const confirmDeleteUserBtn = document.getElementById('confirmDeleteUserBtn');
    if (confirmDeleteUserBtn) {
        confirmDeleteUserBtn.addEventListener('click', async function() {
            if (!currentUserIdToDelete) return;

            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
            this.disabled = true;

            try {
                const response = await fetch(`${API_URL}/api/v1/auth/users/${currentUserIdToDelete}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.detail || "Error al eliminar usuario");
                }

                deleteUserModal.style.display = 'none';
                showSuccess("Usuario eliminado exitosamente.");
                loadAdminUsers();
            } catch (error) {
                console.error(error);
                showError(error.message);
                deleteUserModal.style.display = 'none';
            } finally {
                this.innerHTML = originalText;
                this.disabled = false;
                currentUserIdToDelete = null;
            }
        });
    }

    const closeChangeRoleModalBtns = document.querySelectorAll('.close-modal-change-role, .close-modal-change-role-btn');
    closeChangeRoleModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (changeRoleModal) changeRoleModal.style.display = 'none';
            currentUserToChangeRole = null;
            newRoleToSet = null;
        });
    });

    const confirmChangeRoleBtn = document.getElementById('confirmChangeRoleBtn');
    if (confirmChangeRoleBtn) {
        confirmChangeRoleBtn.addEventListener('click', async function() {
            if (!currentUserToChangeRole || !newRoleToSet) return;

            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            this.disabled = true;

            try {
                const response = await fetch(`${API_URL}/api/v1/auth/users/${currentUserToChangeRole.id}/role`, {
                    method: 'PATCH',
                    headers: { 
                        'Authorization': `Bearer ${getToken()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ role: newRoleToSet })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.detail || "Error al actualizar rol");
                }

                currentUserToChangeRole.selectElement.value = newRoleToSet;
                changeRoleModal.style.display = 'none';
                showSuccess("Rol de usuario actualizado.");
            } catch (error) {
                console.error(error);
                showError(error.message);
                changeRoleModal.style.display = 'none';
            } finally {
                this.innerHTML = originalText;
                this.disabled = false;
                currentUserToChangeRole = null;
                newRoleToSet = null;
            }
        });
    }

    // --- INICIALIZACIÓN DE LA APLICACIÓN ---

    const activeModule = localStorage.getItem('activeModule');
    if (activeModule === 'history') {
        showHistorySection();
    } else if (activeModule === 'shared') {
        showSharedSection();
    } else if (activeModule === 'validate') {
        showValidateSection();
    } else {
        showUploadSection();
    }

    checkServerConnection();

    async function checkServerConnection() {
        try {
            const response = await fetch(`${API_URL}/health`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
                console.log('✅ Servidor conectado correctamente');
            } else {
                console.warn('⚠️ Servidor responde pero con error');
            }
        } catch (error) {
            console.warn('⚠️ No se puede conectar al servidor:', error.message);
        }
    }

    // Exponer helpers e inicializadores globalmente para acceso de los módulos
    window.formatFileSize = formatFileSize;
    window.getFileIconClass = getFileIconClass;
    window.getFileIconColor = getFileIconColor;
    window.getFileTypeName = getFileTypeName;
    window.showSuccess = showSuccess;
    window.showError = showError;
    window.hideMessages = hideMessages;
    window.loadHistory = loadHistory;
    window.loadDocuments = loadDocuments;
    window.saveToLocalStorage = saveToLocalStorage;
    window.showUploadSection = showUploadSection;
    window.showHistorySection = showHistorySection;
    window.showSharedSection = showSharedSection;
    window.showValidateSection = showValidateSection;
});