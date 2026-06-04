/**
 * Módulo de Gestión de Usuarios - Solo para Administradores
 */

const USERS_API_URL = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || "http://localhost:8000";

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Módulo de Gestión de Usuarios Inicializado');

    // Verificar autenticación
    requireAuth();

    // Verificar que sea admin
    const userData = getUserData();
    if (!userData || userData.role !== 'admin') {
        console.error('❌ No autorizado: Solo los administradores pueden acceder');
        window.location.href = 'index.html';
        return;
    }

    // Elementos del DOM
    const btnCreateUser = document.getElementById('btnCreateUser');
    const userModal = document.getElementById('userModal');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const userForm = document.getElementById('userForm');
    const modalTitle = document.getElementById('modalTitle');
    const submitText = document.getElementById('submitText');
    const usersTableBody = document.getElementById('usersTableBody');
    const noUsers = document.getElementById('noUsers');
    const usersTable = document.getElementById('usersTable');
    const usersContent = document.getElementById('usersContent');
    const usersLoading = document.getElementById('usersLoading');
    const alertContainer = document.getElementById('alertContainer');
    const editModeNotice = document.getElementById('editModeNotice');
    const passwordGroup = document.getElementById('passwordGroup');
    const statusGroup = document.getElementById('statusGroup');

    let editingUserId = null;
    let editingUserEmail = null;

    // Event Listeners
    if (btnCreateUser) {
        btnCreateUser.addEventListener('click', () => {
            resetModalForCreation();
            openModal();
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => closeUserModal());
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => closeUserModal());
    }

    if (userForm) {
        userForm.addEventListener('submit', handleFormSubmit);
    }

    // Cerrar modal al hacer click fuera
    userModal.addEventListener('click', function (e) {
        if (e.target === userModal) {
            closeUserModal();
        }
    });

    // Cargar usuarios al iniciar
    loadUsers();

    // Funciones
    function resetModalForCreation() {
        editingUserId = null;
        editingUserEmail = null;
        modalTitle.textContent = 'Crear Nuevo Usuario';
        submitText.textContent = 'Crear Usuario';
        userForm.reset();
        
        // Mostrar todos los campos de creación
        document.getElementById('userEmail').disabled = false;
        document.getElementById('userPassword').required = true;
        passwordGroup.style.display = 'block';
        statusGroup.style.display = 'none';
        editModeNotice.style.display = 'none';
    }

    function openModal() {
        userModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeUserModal() {
        userModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        userForm.reset();
        editingUserId = null;
        editingUserEmail = null;
    }

    async function loadUsers() {
        try {
            usersLoading.style.display = 'block';
            usersContent.style.display = 'none';

            const token = getToken();
            const response = await fetch(`${USERS_API_URL}/api/v1/auth/users`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                // Token inválido o usuario no es admin o está inactivo
                const errorData = await response.json();
                const errorMessage = errorData.detail || 'Sesión expirada o usuario inactivo';
                
                // Si dice "Usuario inactivo", significa que el admin se desactivó a sí mismo
                if (errorMessage.includes('Usuario inactivo')) {
                    if (typeof setLogoutMessage === 'function') {
                        setLogoutMessage('❌ Tu cuenta fue desactivada. Por favor, contacta con otro administrador.');
                    }
                }
                
                window.location.href = 'index.html';
                return;
            }

            usersLoading.style.display = 'none';
            usersContent.style.display = 'block';

            if (!response.ok) {
                throw new Error(`Error al cargar usuarios: ${response.statusText}`);
            }

            const users = await response.json();
            displayUsers(users);
        } catch (error) {
            console.error('❌ Error cargando usuarios:', error);
            usersLoading.style.display = 'none';
            usersContent.style.display = 'block';
            showAlert(`Error al cargar usuarios: ${error.message}`, 'error');
        }
    }

    function displayUsers(users) {
        if (!users || users.length === 0) {
            usersTable.style.display = 'none';
            noUsers.style.display = 'block';
            return;
        }

        usersTable.style.display = 'table';
        noUsers.style.display = 'none';
        usersTableBody.innerHTML = '';

        users.forEach(user => {
            const row = createUserRow(user);
            usersTableBody.appendChild(row);
        });
    }

    function createUserRow(user) {
        const row = document.createElement('tr');

        const roleClass = user.role === 'admin' ? 'role-admin' : 'role-user';
        const roleText = user.role === 'admin' ? 'Administrador' : 'Usuario Normal';
        const statusClass = user.is_active ? 'status-active' : 'status-inactive';
        const statusText = user.is_active ? 'Activo' : 'Inactivo';

        row.innerHTML = `
            <td>${user.email}</td>
            <td><span class="user-role-badge ${roleClass}">${roleText}</span></td>
            <td>
                <span class="user-status ${statusClass}"></span>
                ${statusText}
            </td>
            <td>
                <div class="user-actions">
                    <button class="btn-edit" onclick="editUser(${user.id}, '${user.email}', '${user.role}', ${user.is_active})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-delete" onclick="deleteUser(${user.id}, '${user.email}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </td>
        `;

        return row;
    }

    async function handleFormSubmit(e) {
        e.preventDefault();

        const email = document.getElementById('userEmail').value;
        const password = document.getElementById('userPassword').value;
        const role = document.getElementById('userRole').value;
        const isActive = document.getElementById('userStatus').value;

        // Validación
        if (!email || !role) {
            showAlert('Por favor completa todos los campos requeridos', 'error');
            return;
        }

        // En modo creación, requiere contraseña
        if (!editingUserId && !password) {
            showAlert('La contraseña es requerida para crear un usuario', 'error');
            return;
        }

        // Validación: No permitir desactivar al usuario actual
        if (editingUserId && isActive === 'false') {
            const currentUser = getUserData();
            if (currentUser && currentUser.email === email) {
                showAlert('❌ No puedes desactivar tu propia cuenta. Debes mantener al menos un administrador activo.', 'error');
                return;
            }
        }

        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Procesando...';

        try {
            const token = getToken();

            if (editingUserId) {
                // Modo edición: actualizar rol y estado
                const updateData = {
                    role: role
                };

                // Agregar estado si se cambió
                if (isActive !== '') {
                    updateData.is_active = isActive === 'true';
                }

                const response = await fetch(`${USERS_API_URL}/api/v1/auth/users/${editingUserId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updateData)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.detail || `Error: ${response.statusText}`);
                }

                showAlert(`✅ Usuario ${email} actualizado exitosamente`, 'success');
            } else {
                // Modo creación: crear nuevo usuario
                if (!password) {
                    throw new Error('Contraseña requerida');
                }

                const userData = {
                    email: email,
                    password: password,
                    role: role
                };

                const response = await fetch(`${USERS_API_URL}/api/v1/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(userData)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.detail || `Error: ${response.statusText}`);
                }

                showAlert(`✅ Usuario ${email} creado exitosamente`, 'success');
            }

            closeUserModal();
            await loadUsers();
        } catch (error) {
            console.error('❌ Error:', error);
            showAlert(`Error: ${error.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    function showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;

        const iconClass = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');

        alert.innerHTML = `
            <i class="fas ${iconClass}"></i>
            <span>${message}</span>
        `;

        alertContainer.innerHTML = '';
        alertContainer.appendChild(alert);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    // Funciones globales para los botones
    window.editUser = function (userId, userEmail, userRole, isActive) {
        console.log('🔧 Editando usuario:', userId, userEmail, userRole, isActive);
        
        editingUserId = userId;
        editingUserEmail = userEmail;
        
        modalTitle.textContent = `Editar Usuario: ${userEmail}`;
        submitText.textContent = 'Guardar Cambios';
        
        // Ocultar campos no editables en modo edición
        document.getElementById('userEmail').value = userEmail;
        document.getElementById('userEmail').disabled = true;
        document.getElementById('userPassword').value = '';
        document.getElementById('userPassword').required = false;
        passwordGroup.style.display = 'none';
        
        // Mostrar campo de estado
        statusGroup.style.display = 'block';
        editModeNotice.style.display = 'block';
        
        // Establecer valores actuales
        document.getElementById('userRole').value = userRole;
        document.getElementById('userStatus').value = isActive ? 'true' : 'false';
        
        // Agregar aviso si es el usuario actual
        const currentUser = getUserData();
        if (currentUser && currentUser.email === userEmail) {
            const warningDiv = document.createElement('div');
            warningDiv.id = 'currentUserWarning';
            warningDiv.style.backgroundColor = '#fff3cd';
            warningDiv.style.color = '#856404';
            warningDiv.style.padding = '10px';
            warningDiv.style.borderRadius = '4px';
            warningDiv.style.marginBottom = '15px';
            warningDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <strong> Advertencia:</strong> Este es tu usuario actual. No puedes desactivarte a ti mismo.
            `;
            
            const existingWarning = document.getElementById('currentUserWarning');
            if (existingWarning) existingWarning.remove();
            
            const form = document.getElementById('userForm');
            form.insertBefore(warningDiv, form.firstChild);
        }
        
        openModal();
    };

    window.deleteUser = async function (userId, userEmail) {
        if (!confirm(`¿Estás seguro que deseas eliminar a ${userEmail}?`)) {
            return;
        }

        try {
            const token = getToken();
            const response = await fetch(`${USERS_API_URL}/api/v1/auth/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error al eliminar usuario: ${response.statusText}`);
            }

            showAlert(`✅ Usuario ${userEmail} eliminado exitosamente`, 'success');
            await loadUsers();
        } catch (error) {
            console.error('❌ Error eliminando usuario:', error);
            showAlert(`Error: ${error.message}`, 'error');
        }
    };
});
