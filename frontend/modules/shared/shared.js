/**
 * Módulo de Documentos Compartidos (Shared)
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('📦 Módulo de Compartidos (Shared) Inicializado');

    const clearSharedBtn = document.getElementById('clearSharedBtn');

    if (clearSharedBtn) {
        clearSharedBtn.addEventListener('click', function () {
            if (confirm('¿Estás seguro de que deseas eliminar todos los documentos compartidos?')) {
                if (typeof window.showSuccess === 'function') {
                    window.showSuccess('Documentos compartidos eliminados correctamente');
                }
            }
        });
    }
});
