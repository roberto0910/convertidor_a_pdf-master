/**
 * Script para login - SOLO MODO SIMULACIÓN
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Login cargado en modo SIMULACIÓN');

    // Redirigir a inicio si ya está autenticado
    redirectIfAuthenticated();

    // Elementos del DOM
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const loginView = document.getElementById('loginView');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const rememberCheckbox = document.getElementById('remember');
    const loginBtn = loginForm.querySelector('.login-btn');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    // Toggle mostrar/ocultar contraseña
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            this.querySelector('i').className = type === 'text' ? 'fas fa-eye-slash' : 'fas fa-eye';
        });
    }

    // Validar email ITB
    function validateEmail() {
        const email = emailInput.value.trim();

        if (!email) {
            emailError.textContent = 'El correo electrónico es requerido';
            return false;
        }

        if (!isValidITBEmail(email)) {
            emailError.textContent = 'Debes usar un correo institucional ITB (@itb.edu.ec)';
            return false;
        }

        emailError.textContent = '';
        return true;
    }

    // Validar contraseña
    function validatePassword() {
        const password = passwordInput.value;

        if (!password) {
            passwordError.textContent = 'La contraseña es requerida';
            return false;
        }

        if (password.length < 6) {
            passwordError.textContent = 'La contraseña debe tener al menos 6 caracteres';
            return false;
        }

        passwordError.textContent = '';
        return true;
    }

    // Login real
    async function realLogin() {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!validateEmail() || !validatePassword()) return;

        loginBtn.disabled = true;
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';

        try {
            await loginUser(email, password);

            // Mostrar éxito
            loginForm.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <i class="fas fa-check-circle" style="font-size: 70px; color: var(--itb-success); margin-bottom: 20px;"></i>
                    <h3 style="color: var(--itb-primary); margin-bottom: 15px;">¡Bienvenido al EVA ITB!</h3>
                    <p style="font-size: 0.9rem; color: var(--itb-gray);">
                        <i class="fas fa-sync fa-spin"></i> Redirigiendo al panel principal...
                    </p>
                </div>
            `;

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        } catch (error) {
            alert(error.message);
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalText;
        }
    }

    // Manejar envío del formulario de Login
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        realLogin();
    });

    // Permitir Enter para enviar
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    // Cargar datos si existen
    const savedEmail = localStorage.getItem('last-email');
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
});
