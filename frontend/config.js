/**
 * Configuración global de la aplicación
 */

// URL base de la API (puede cambiarse según el entorno)
const APP_CONFIG = {
    API_BASE_URL: 'http://localhost:8000',

    // Endpoints de autenticación
    ENDPOINTS: {
        LOGIN: '/api/v1/auth/login',
        REGISTER: '/api/v1/auth/register',
        CONVERT: '/convert',
        UPLOAD: '/api/v1/files/upload',
        MY_DOCUMENTS: '/api/v1/files/my-documents',
        DOWNLOAD: '/api/v1/files/download'
    },

    // Configuración de validación
    VALIDATION: {
        MIN_PASSWORD_LENGTH: 6,
        ALLOWED_FILE_EXTENSIONS: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf'],
        MAX_FILE_SIZE_MB: 50
    },

    // Configuración de UI
    UI: {
        SUCCESS_TIMEOUT: 2000,
        ERROR_TIMEOUT: 5000
    }
};

// Hacer disponible globalmente
window.APP_CONFIG = APP_CONFIG;