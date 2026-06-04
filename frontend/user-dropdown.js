/**
 * Manejo del menú desplegable del usuario
 */

document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM
    const dropdownBtn = document.getElementById('userDropdownBtn');
    const dropdownMenu = document.getElementById('userDropdownMenu');

    // Elementos del Dropdown
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    const dropdownName = document.getElementById('dropdownName');
    const dropdownRole = document.getElementById('dropdownRole');

    // Elementos del Header
    const headerAvatar = document.getElementById('userAvatar');
    const headerName = document.getElementById('userName');
    const headerRole = document.getElementById('userRole');

    const logoutLink = document.querySelector('a[href="logout.html"]');

    if (dropdownBtn && dropdownMenu) {
        // Cargar datos del usuario
        const userData = getUserData();
        if (userData) {
            // Lógica para nombre y rol
            const email = userData.email || '';
            let displayName = userData.name || email;

            // Si es email, intentar embellecer (steven@itb... -> Steven)
            if (displayName.includes('@')) {
                const namePart = displayName.split('@')[0];
                displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
            }

            const roleDisplay = userData.role === 'admin' ? 'Administrador' : (userData.carrera || 'Estudiante - Desarrollo de Software');

            // Actualizar Dropdown
            if (dropdownName) dropdownName.textContent = displayName;
            if (dropdownRole) dropdownRole.textContent = roleDisplay;

            // Actualizar Header
            if (headerName) headerName.textContent = displayName;
            if (headerRole) headerRole.textContent = roleDisplay;

            // Lógica para Avatar (Iniciales)
            let initials = 'US';
            if (userData.name) {
                initials = userData.name.substring(0, 2).toUpperCase();
            } else if (email) {
                initials = email.substring(0, 2).toUpperCase();
            }

            if (dropdownAvatar) dropdownAvatar.textContent = initials;
            if (headerAvatar) headerAvatar.textContent = initials;
        }

        // Alternar visibilidad del dropdown
        dropdownBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
            dropdownBtn.classList.toggle('active');
        });

        // Cerrar dropdown al hacer click fuera
        document.addEventListener('click', function (e) {
            if (!dropdownMenu.contains(e.target) && !dropdownBtn.contains(e.target)) {
                dropdownMenu.classList.remove('show');
                dropdownBtn.classList.remove('active');
            }
        });

        // Prevenir que el dropdown se cierre al hacer click dentro
        dropdownMenu.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        // Mostrar opción de gestión de usuarios si es admin
        const adminDivider = document.getElementById('adminDivider');
        const usersAdminDropdownBtn = document.getElementById('usersAdminDropdownBtn');
        if (userData && userData.role === 'admin' && adminDivider && usersAdminDropdownBtn) {
            adminDivider.style.display = 'block';
            usersAdminDropdownBtn.style.display = 'block';

            usersAdminDropdownBtn.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = 'users-management.html';
            });
        }

        // Manejar tecla Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                dropdownMenu.classList.remove('show');
                dropdownBtn.classList.remove('active');
            }
        });

        // **AGREGAR: Manejar clic en el enlace de logout**
        if (logoutLink) {
            logoutLink.addEventListener('click', function (e) {
                e.preventDefault();

                console.log('👋 Iniciando proceso de logout...');

                // Paso 1: Limpiar inmediatamente los datos principales
                localStorage.removeItem('eva-access-token');
                localStorage.removeItem('eva-user-data');
                sessionStorage.clear();

                // Paso 2: Cerrar el dropdown
                dropdownMenu.classList.remove('show');
                dropdownBtn.classList.remove('active');

                // Paso 3: Redirigir DIRECTAMENTE sin mostrar mensajes
                // Usar replace para no dejar historial
                setTimeout(() => {
                    window.location.replace('logout.html');
                }, 100);
            });
        }
    }
});