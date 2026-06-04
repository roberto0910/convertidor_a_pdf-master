/**
 * Utilidades de autenticación - MODO SIMULACIÓN
 */

const AUTH_CONFIG = {
    API_URL: window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : 'http://localhost:8000',
    TOKEN_KEY: 'eva-access-token',
    USER_KEY: 'eva-user-data',
    LOGOUT_MESSAGE_KEY: 'eva-logout-message',
    USE_SIMULATION: false
};

// Guardar token JWT en localStorage
function saveToken(token) {
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
}

// Obtener token JWT del localStorage
function getToken() {
    return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
}

// Guardar mensaje de logout
function setLogoutMessage(message) {
    localStorage.setItem(AUTH_CONFIG.LOGOUT_MESSAGE_KEY, message);
}

// Obtener mensaje de logout
function getLogoutMessage() {
    const message = localStorage.getItem(AUTH_CONFIG.LOGOUT_MESSAGE_KEY);
    localStorage.removeItem(AUTH_CONFIG.LOGOUT_MESSAGE_KEY);
    return message;
}

/**
 * Decodifica un JWT y verifica si ha expirado
 * @param {string} token - Token JWT
 * @returns {boolean} - True si ha expirado o es inválido
 */
function isTokenExpired(token) {
    if (!token) return true;

    try {
        // En un JWT, el payload es la segunda parte (separada por puntos)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);

        // El campo 'exp' está en segundos
        if (!payload.exp) return false;

        const currentTime = Math.floor(Date.now() / 1000);
        const expired = payload.exp < currentTime;

        if (expired) {
            console.warn('🕒 Token expirado:', new Date(payload.exp * 1000).toLocaleString());
        }

        return expired;
    } catch (error) {
        console.error('❌ Error al decodificar token:', error);
        return true;
    }
}

// Guardar datos del usuario
function saveUserData(userData) {
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(userData));
}

// Obtener datos del usuario
function getUserData() {
    const data = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    return data ? JSON.parse(data) : null;
}

// Verificar si el usuario está autenticado
function isAuthenticated() {
    const token = getToken();

    // Si no hay token, no está autenticado
    if (!token) return false;

    // Si el token ha expirado, no es válido
    if (isTokenExpired(token)) {
        console.log('🔄 Sesión expirada detectada en isAuthenticated');
        return false;
    }

    return true;
}

// Limpiar datos de autenticación (logout)
function clearAuth() {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
}

// Redirigir a login si no está autenticado
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

// Redirigir a inicio si ya está autenticado
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = 'index.html';
    }
}

// Formatear información del usuario para mostrar
function formatUserInfo(userData) {
    if (!userData) return { initials: 'US', role: 'Estudiante' };

    return {
        email: userData.email || 'usuario@itb.edu.ec',
        role: userData.role || 'Estudiante',
        initials: userData.email ?
            userData.email.split('@')[0].substring(0, 2).toUpperCase() :
            'US'
    };
}

// Cerrar sesión - Redirige a la página de logout
function logout() {
    window.location.href = 'logout.html';
}

// Función para limpiar datos de autenticación
function clearAuthData() {
    // Limpiar localStorage
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userSession');

    // Limpiar sessionStorage
    sessionStorage.clear();

    // Limpiar cookies relacionadas con la sesión
    document.cookie.split(";").forEach(function (c) {
        document.cookie = c.replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    console.log('✅ Datos de autenticación limpiados');

    // Limpiar todos los datos específicos de la aplicación
    const appKeys = ['conversionHistory', 'recentFiles', 'userPreferences', 'uploadedFiles'];
    appKeys.forEach(key => localStorage.removeItem(key));
}

// Interceptor global de fetch para manejar sesiones expiradas o eliminadas
(function() {
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        try {
            const response = await originalFetch(...args);
            
            // Si el servidor responde 401 (No autorizado)
            if (response.status === 401) {
                const url = typeof args[0] === 'string' ? args[0] : args[0].url;
                
                // No redirigir si el error es durante el propio login o registro
                if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
                    console.warn('⚠️ Sesión inválida detectada (401). Cerrando sesión...');
                    
                    // Solo redirigir si estamos en una página que requiere auth
                    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
                        clearAuthData();
                        window.location.href = 'login.html?session=expired';
                    }
                }
            }
            return response;
        } catch (error) {
            throw error;
        }
    };
})();

// Validar email del ITB (para simulación)
function isValidITBEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@itb\.edu\.ec$/;
    return emailRegex.test(email);
}

// Inicializar funcionalidades comunes
function initializeAuth() {
    const token = getToken();

    // Si estamos en una página protegida (como index.html)
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        if (!isAuthenticated()) {
            console.log('🚪 Redirigiendo a login por falta de sesión o expiración');
            requireAuth();
            return;
        }

        // Iniciar verificador de sesión cada 30 segundos
        setInterval(async () => {
            const token = getToken();
            if (!token) return;

            if (isTokenExpired(token)) {
                console.log('⏰ Expiración detectada por el timer');
                logout();
                return;
            }

            // Verificar si el usuario aún existe en el servidor (por si fue eliminado)
            try {
                const response = await fetch(`${AUTH_CONFIG.API_URL}/api/v1/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.status === 401) {
                    console.warn('🚫 Sesión invalidada o usuario eliminado por un administrador');
                    logout();
                }
            } catch (error) {
                // Si hay error de red no hacemos nada para no cerrar sesión por error de conexión
                console.log('📡 Error de conexión al verificar sesión');
            }
        }, 30000);
    }

    // Redirigir si ya está autenticado y está en login/register
    if (window.location.pathname.includes('login.html') ||
        window.location.pathname.includes('register.html')) {
        if (isAuthenticated()) {
            redirectIfAuthenticated();
        }
    }
}

// Real Login
async function loginUser(email, password) {
    try {
        const response = await fetch(`${AUTH_CONFIG.API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al iniciar sesión');
        }

        const data = await response.json();
        saveToken(data.access_token);

        // Obtener datos reales del usuario
        try {
            const userResponse = await fetch(`${AUTH_CONFIG.API_URL}/api/v1/auth/me`, {
                headers: { 'Authorization': `Bearer ${data.access_token}` }
            });
            if (userResponse.ok) {
                const userData = await userResponse.json();
                saveUserData(userData);
            } else {
                saveUserData({ email, role: 'user' });
            }
        } catch (e) {
            saveUserData({ email, role: 'user' });
        }
        return true;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Real Register
async function registerUser(email, password, role = 'user') {
    try {
        const response = await fetch(`${AUTH_CONFIG.API_URL}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error en el registro');
        }

        return await response.json();
    } catch (error) {
        console.error('Register error:', error);
        throw error;
    }
}


/**
 * Solicita el restablecimiento de contraseña (fase de envío de correo)
 * @param {string} email - Correo electrónico del usuario
 * @returns {Promise<Object>} - Respuesta de la API
 */
async function requestPasswordRecovery(email) {
    try {
        const response = await fetch(`${AUTH_CONFIG.API_URL}/api/v1/auth/password-recovery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error en la solicitud de recuperación');
        }

        return await response.json();
    } catch (error) {
        console.error('Recovery request error:', error);
        throw error;
    }
}

/**
 * Restablece la contraseña usando un token válido
 * @param {string} token - Token recibido por correo
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<Object>} - Respuesta de la API
 */
async function resetPassword(token, newPassword) {
    try {
        const response = await fetch(`${AUTH_CONFIG.API_URL}/api/v1/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, new_password: newPassword })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al restablecer la contraseña');
        }

        return await response.json();
    } catch (error) {
        console.error('Reset password error:', error);
        throw error;
    }
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
    window.clearAuthData = clearAuthData;
    window.getUserData = getUserData;
    window.isAuthenticated = isAuthenticated;
    window.logout = logout;
    window.requireAuth = requireAuth;
    window.requestPasswordRecovery = requestPasswordRecovery;
    window.resetPassword = resetPassword;
}
