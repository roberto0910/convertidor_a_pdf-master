/**
 * Script para registro - SOLO MODO SIMULACIÓN
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Registro cargado en modo SIMULACIÓN');

    // Elementos del DOM
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    const termsCheckbox = document.getElementById('terms');
    const registerBtn = registerForm.querySelector('.login-btn');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    const strengthProgress = document.getElementById('strengthProgress');
    const strengthText = document.getElementById('strengthText');

    // Toggle mostrar/ocultar contraseña
    function setupPasswordToggle(input, button) {
        if (!button || !input) return;

        button.addEventListener('click', function () {
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            this.querySelector('i').className = type === 'text' ? 'fas fa-eye-slash' : 'fas fa-eye';
        });
    }

    setupPasswordToggle(passwordInput, togglePasswordBtn);
    setupPasswordToggle(confirmPasswordInput, toggleConfirmPasswordBtn);

    // Validar fortaleza de contraseña
    function updatePasswordStrength() {
        if (!passwordInput || !strengthProgress || !strengthText) return;

        const password = passwordInput.value;
        let strength = 0;

        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;

        strengthProgress.style.width = strength + '%';

        if (strength < 50) {
            strengthProgress.style.backgroundColor = '#e74c3c';
            strengthText.textContent = 'Débil';
        } else if (strength < 75) {
            strengthProgress.style.backgroundColor = '#f39c12';
            strengthText.textContent = 'Media';
        } else {
            strengthProgress.style.backgroundColor = '#27ae60';
            strengthText.textContent = 'Fuerte';
        }
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', updatePasswordStrength);
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

    // Registro real
    async function realRegister() {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!validateEmail()) return;

        if (password.length < 8) {
            alert('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        if (!termsCheckbox.checked) {
            alert('Debes aceptar los términos y condiciones');
            return;
        }

        registerBtn.disabled = true;
        const originalText = registerBtn.innerHTML;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';

        try {
            const roleElement = document.getElementById('role');
            const role = roleElement ? roleElement.value : 'user';
            
            await registerUser(email, password, role);

            registerForm.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <i class="fas fa-check-circle" style="font-size: 70px; color: var(--itb-success); margin-bottom: 20px;"></i>
                    <h3 style="color: var(--itb-primary); margin-bottom: 15px;">¡Cuenta Creada Exitosamente!</h3>
                    <p style="font-size: 0.9rem; color: var(--itb-gray);">
                        <i class="fas fa-sync fa-spin"></i> Redirigiendo al login...
                    </p>
                </div>
            `;

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            alert(error.message);
            registerBtn.disabled = false;
            registerBtn.innerHTML = originalText;
        }
    }

    // Manejar envío del formulario
    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        realRegister();
    });
});