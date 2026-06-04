document.addEventListener('DOMContentLoaded', function () {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const resetError = document.getElementById('resetError');
    const resetBtn = document.getElementById('resetBtn');
    const resetPasswordView = document.getElementById('resetPasswordView');
    const successView = document.getElementById('successView');
    const errorView = document.getElementById('errorView');
    const errorDescription = document.getElementById('errorDescription');

    // Obtener token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        resetPasswordView.style.display = 'none';
        errorView.style.display = 'block';
        errorDescription.textContent = 'No se encontró un token de seguridad válido en el enlace.';
        return;
    }

    // Lógica para mostrar/ocultar contraseña
    function setupToggle(toggleId, inputId) {
        const toggleBtn = document.getElementById(toggleId);
        const input = document.getElementById(inputId);

        if (toggleBtn && input) {
            toggleBtn.addEventListener('click', function () {
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;

                const icon = this.querySelector('i');
                if (type === 'text') {
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        }
    }

    setupToggle('toggleNewPassword', 'newPassword');
    setupToggle('toggleConfirmPassword', 'confirmPassword');

    if (!resetPasswordForm) return;

    resetPasswordForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const pass = newPassword.value;
        const confirm = confirmPassword.value;

        // Validaciones
        if (pass.length < 8) {
            resetError.textContent = 'La contraseña debe tener al menos 8 caracteres';
            return;
        }

        if (pass !== confirm) {
            resetError.textContent = 'Las contraseñas no coinciden';
            return;
        }

        resetError.textContent = '';
        resetBtn.disabled = true;
        const originalText = resetBtn.innerHTML;
        resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

        try {
            // Llamada real a la API heredada de auth-utils.js
            await window.resetPassword(token, pass);

            // Mostrar éxito
            resetPasswordView.style.display = 'none';
            successView.style.display = 'block';

        } catch (error) {
            console.error('Error al restablecer:', error);

            if (error.message.includes('400') || error.message.includes('Token inválido')) {
                resetPasswordView.style.display = 'none';
                errorView.style.display = 'block';
                errorDescription.textContent = 'Token inválido o expirado. Por favor solicita un nuevo enlace.';
            } else if (error.message.includes('403') || error.message.includes('Usuario inactivo')) {
                resetError.textContent = 'Tu usuario está inactivo. Contacta a soporte.';
            } else {
                resetError.textContent = 'Ocurrió un error inesperado: ' + error.message;
            }

            resetBtn.disabled = false;
            resetBtn.innerHTML = originalText;
        }
    });
});
