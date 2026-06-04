/**
 * Módulo de Validación de Firmas Digitales (Validate)
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('📦 Módulo de Validación (Validate) Inicializado');

    const API_URL = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || "http://localhost:8000";

    const validateInput = document.getElementById('validateInput');
    const selectValidateBtn = document.getElementById('selectValidateBtn');
    const validationResult = document.getElementById('validationResult');

    if (selectValidateBtn) {
        selectValidateBtn.onclick = () => validateInput.click();
    }

    if (validateInput) {
        validateInput.onchange = async function () {
            if (this.files.length > 0) {
                await performValidation(this.files[0]);
            }
        };
    }

    /**
     * Envía el archivo PDF al servicio de validación en el backend y renderiza la respuesta.
     * @param {File} file - El PDF a validar.
     */
    async function performValidation(file) {
        if (!validationResult || !file) return;

        validationResult.style.display = 'block';
        validationResult.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--itb-secondary);"></i>
                <p style="margin-top: 10px;">Analizando firmas digitales del PDF...</p>
            </div>
        `;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/documents/validate`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Error en servidor: ${response.statusText}`);
            }

            const data = await response.json();

            // Renderizado interactivo del resultado del análisis de la firma digital
            validationResult.innerHTML = `
                <div style="border: 1px solid var(--itb-border); border-radius: 8px; padding: 20px; background: #fff;">
                    <h4 style="color: var(--itb-primary); margin-bottom: 20px; border-bottom: 2px solid var(--itb-light); padding-bottom: 10px;">
                        <i class="fas fa-clipboard-check"></i> Resultado de la Validación
                    </h4>
                    <div style="display: grid; gap: 12px; font-size: 0.95rem;">
                        <p><strong>Estado de Firma:</strong> ${data.is_valid ? '<span style="color: #27ae60; font-weight: bold;">✅ VÁLIDA</span>' : '<span style="color: #e74c3c; font-weight: bold;">❌ INVÁLIDA</span>'}</p>
                        <p><strong>Firmante detectado:</strong> ${data.signer_name || 'Desconocido'}</p>
                        <p><strong>Fecha y Hora:</strong> ${data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}</p>
                        <p><strong>Nivel de Seguridad:</strong> ${data.trusted ? 'Certificado de Integridad' : 'Firma no reconocida'}</p>
                    </div>
                    <div style="margin-top: 20px;">
                        <p style="font-size: 0.8rem; color: var(--itb-gray); margin-bottom: 5px;">Respuesta JSON del Servidor:</p>
                        <pre style="background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 6px; font-size: 0.85rem; overflow: auto; max-height: 200px;">${JSON.stringify(data, null, 2)}</pre>
                    </div>
                </div>
            `;
        } catch (error) {
            validationResult.innerHTML = `
                <div style="color: #e74c3c; padding: 20px; background: #fdf2f2; border-radius: 8px; border: 1px solid #f9d6d6;">
                    <i class="fas fa-times-circle"></i> Error al conectar con el servicio de validación: ${error.message}
                </div>
            `;
        }
    }
});
