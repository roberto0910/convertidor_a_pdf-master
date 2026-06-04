/**
 * Script para manejar el proceso de logout - SIN MENSAJES DE CONFIRMACIÓN
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚪 Proceso de logout iniciado - Sin mensajes de confirmación');
    
    const progressBar = document.getElementById('progressBar');
    const logoutTime = 2000; // Reducido a 2 segundos
    const redirectTime = logoutTime + 300;
    
    // Paso 1: Inmediatamente eliminar cualquier evento beforeunload
    window.onbeforeunload = null;
    window.removeEventListener('beforeunload', handleBeforeUnload);
    
    // Función vacía para beforeunload
    function handleBeforeUnload(e) {
        // No hacer nada - permitir navegación sin mensajes
        return undefined;
    }
    
    // Configurar beforeunload sin mensajes
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Paso 2: Iniciar animación de progreso
    if (progressBar) {
        setTimeout(() => {
            progressBar.style.width = '100%';
        }, 100);
    }
    
    // Paso 3: Ejecutar el logout inmediatamente
    performLogout();
    
    // Función principal de logout
    function performLogout() {
        try {
            console.log('🧹 Limpiando datos de sesión...');
            
            // Limpiar TODOS los datos de localStorage
            localStorage.clear();
            
            // Limpiar sessionStorage
            sessionStorage.clear();
            
            // Limpiar cookies de forma específica
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
            }
            
            // También limpiar datos específicos de la aplicación
            const appDataKeys = [
                'eva-access-token',
                'eva-user-data',
                'conversionHistory',
                'authToken',
                'userSession',
                'recentFiles',
                'userPreferences'
            ];
            
            appDataKeys.forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });
            
            console.log('✅ Datos de sesión limpiados correctamente');
            
            // Paso 4: Redirigir al login SIN mensajes
            setTimeout(() => {
                console.log('🔄 Redirigiendo a login...');
                
                // Usar location.replace para no dejar historial
                const loginUrl = 'login.html';
                
                // Método 1: Intentar con replace
                try {
                    window.location.replace(loginUrl);
                } catch (e) {
                    // Método 2: Si falla, usar href
                    window.location.href = loginUrl;
                }
                
                // Método 3: Forzar redirección después de un tiempo
                setTimeout(() => {
                    if (window.location.pathname.includes('logout.html')) {
                        window.location.href = loginUrl;
                    }
                }, 1000);
                
            }, redirectTime);
            
        } catch (error) {
            console.error('❌ Error durante el logout:', error);
            
            // Si hay error, redirigir de todos modos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
    }
    
    // Paso 5: Prevenir navegación hacia atrás
    history.pushState(null, null, window.location.href);
    
    window.onpopstate = function(event) {
        // Forzar a permanecer en la página de logout o ir al login
        history.go(1);
        window.location.href = 'login.html';
    };
    
    // También prevenir que el usuario pueda recargar la página
    document.addEventListener('keydown', function(e) {
        // Bloquear F5
        if (e.key === 'F5') {
            e.preventDefault();
            return false;
        }
        
        // Bloquear Ctrl+R / Cmd+R
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            return false;
        }
    });
    
    // Paso 6: Redirección de emergencia después de 5 segundos
    setTimeout(function() {
        if (window.location.pathname.includes('logout.html')) {
            console.log('⚠️ Redirección de emergencia activada');
            window.location.replace('login.html');
        }
    }, 5000);
});

// Remover completamente cualquier manejador beforeunload global
(function() {
    'use strict';
    
    // Sobrescribir cualquier beforeunload existente
    window.onbeforeunload = null;
    
    // Agregar nuestro propio manejador que NO muestre mensajes
    window.addEventListener('beforeunload', function(e) {
        // IMPORTANTE: No llamar a preventDefault() y no retornar valor
        // Esto evita que el navegador muestre el mensaje
        return null;
    });
    
    // También limpiar event listeners específicos
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
        if (type === 'beforeunload') {
            // No agregar nuevos listeners de beforeunload
            console.log('🚫 Bloqueado nuevo listener de beforeunload');
            return;
        }
        originalAddEventListener.call(window, type, listener, options);
    };
})();