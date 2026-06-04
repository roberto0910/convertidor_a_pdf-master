document.addEventListener('DOMContentLoaded', function () {
    const recoveryForm = document.getElementById('recoveryForm');
    const recoveryEmailInput = document.getElementById('recoveryEmail');
    const sendBtn = document.getElementById('sendBtn');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    if (!recoveryForm) return;

    recoveryForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = recoveryEmailInput.value.trim();
        if (!email) return;

        // Reset UI
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
        sendBtn.disabled = true;
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        try {
            // Llamar a la API
            await window.requestPasswordRecovery(email);

            // Mostrar éxito siempre (seguridad)
            recoveryForm.style.display = 'none';
            successMessage.style.display = 'block';

        } catch (error) {
            console.error(error);
            errorMessage.style.display = 'block';

            if (error.message.includes('500') || error.message.includes('Configuración')) {
                errorText.textContent = 'Configuración de correo no disponible. Contacta al administrador.';
            } else {
                // Incluso si falla (ej 404), por seguridad podríamos mostrar éxito, 
                // pero si es un error de servidor (500) sí lo mostramos.
                // Para este ejercicio manejamos el error explícito si es de configuración.
                errorText.textContent = 'Ocurrió un error al procesar la solicitud.';
            }

            sendBtn.disabled = false;
            sendBtn.innerHTML = originalText;
        }
    });
});
