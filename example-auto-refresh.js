// Ejemplo de uso de my-auth-google con auto-renovación de tokens

import Auth, { Logout, checkTokenStatus, forceTokenRefresh } from './src/index.js';

// Configuración de autenticación con auto-renovación
const API_KEY = 'tu_api_key_aqui';
const CLIENT_ID = 'tu_client_id_aqui';

// Función de callback que se ejecuta cuando el token se renueva automáticamente
function onTokenRefreshed(newToken) {
  console.log('🔄 Token renovado automáticamente:', {
    expires_in: newToken.expires_in,
    scope: newToken.scope,
    renewed_at: new Date().toISOString()
  });
  
  // Aquí puedes notificar a tu aplicación que el token se renovó
  // Por ejemplo, actualizar el estado de la UI, enviar notificación, etc.
  updateUITokenStatus('Token renovado automáticamente');
}

// Inicializar autenticación con auto-renovación
async function initAuth() {
  try {
    const isAuthenticated = await Auth(API_KEY, CLIENT_ID, {
      autoRefresh: true,              // Habilitar auto-renovación (por defecto true)
      onTokenRefresh: onTokenRefreshed // Callback cuando se renueve el token
    });
    
    if (isAuthenticated) {
      console.log('✅ Autenticación exitosa');
      showTokenStatus();
      startTokenStatusMonitor();
    } else {
      console.log('❌ Falló la autenticación');
    }
  } catch (error) {
    console.error('Error en autenticación:', error);
  }
}

// Función para mostrar el estado actual del token
function showTokenStatus() {
  const status = checkTokenStatus();
  
  console.log('📊 Estado del token:', {
    valid: status.valid,
    needsRefresh: status.needsRefresh,
    timeUntilExpiry: Math.round(status.timeUntilExpiry / 1000 / 60) + ' minutos',
    timeUntilExpiryMs: status.timeUntilExpiry
  });
  
  return status;
}

// Función para forzar renovación manual (útil para testing o casos especiales)
async function manualRefresh() {
  try {
    console.log('🔄 Forzando renovación manual del token...');
    const success = await forceTokenRefresh();
    
    if (success) {
      console.log('✅ Token renovado manualmente');
      showTokenStatus();
    } else {
      console.log('❌ Falló la renovación manual');
    }
  } catch (error) {
    console.error('Error en renovación manual:', error);
  }
}

// Monitor de estado del token para la UI (opcional)
function startTokenStatusMonitor() {
  // Actualizar UI cada minuto con el estado del token
  setInterval(() => {
    const status = showTokenStatus();
    updateUITokenStatus(`Token válido por ${Math.round(status.timeUntilExpiry / 1000 / 60)} minutos`);
  }, 60000); // Cada minuto
}

// Función para actualizar la UI (ejemplo)
function updateUITokenStatus(message) {
  // Aquí actualizarías tu interfaz de usuario
  console.log('🖥️ UI Update:', message);
  
  // Ejemplo de actualización de DOM
  const statusElement = document.getElementById('token-status');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.style.color = message.includes('renovado') ? 'green' : 'blue';
  }
}

// Función de logout que detiene todo el monitoreo
function performLogout() {
  console.log('👋 Cerrando sesión...');
  const success = Logout();
  
  if (success) {
    console.log('✅ Logout exitoso - Monitoreo de tokens detenido');
    updateUITokenStatus('No autenticado');
  } else {
    console.log('❌ Error en logout');
  }
}

// Ejemplo de uso en el contexto de una aplicación React/Vue/Angular
function setupAuthInComponent() {
  // En el mounted/useEffect/ngOnInit de tu componente
  initAuth();
  
  // Para mostrar estado en tiempo real
  const tokenStatusInterval = setInterval(() => {
    const status = checkTokenStatus();
    if (!status.valid && !status.needsRefresh) {
      // Token expirado completamente, necesita re-autenticación
      console.log('⚠️ Token expirado, necesita re-autenticación manual');
      clearInterval(tokenStatusInterval);
    }
  }, 30000); // Cada 30 segundos
  
  // Cleanup en unmount/onDestroy
  return () => {
    clearInterval(tokenStatusInterval);
  };
}

// Exportar funciones para uso en otras partes de la aplicación
export {
  initAuth,
  showTokenStatus,
  manualRefresh,
  performLogout,
  setupAuthInComponent
};

// Ejemplo de uso directo
// initAuth();

/* 
CARACTERÍSTICAS PRINCIPALES:

1. AUTO-RENOVACIÓN AUTOMÁTICA:
   - Se verifica cada 5 minutos si el token necesita renovación
   - Se renueva automáticamente 10 minutos antes de expirar
   - Funciona en segundo plano sin interrumpir al usuario

2. CALLBACKS Y NOTIFICACIONES:
   - onTokenRefresh: Se ejecuta cuando se renueva automáticamente
   - Puedes actualizar la UI o estado de la aplicación

3. FUNCIONES DE UTILIDAD:
   - checkTokenStatus(): Verificar estado actual del token
   - forceTokenRefresh(): Forzar renovación manual
   - Logout(): Detiene todo el monitoreo

4. CONFIGURACIÓN FLEXIBLE:
   - autoRefresh: true/false para habilitar/deshabilitar auto-renovación
   - onTokenRefresh: callback personalizable

5. MANEJO DE ERRORES:
   - Si falla la renovación automática, se registra el error
   - La aplicación puede decidir cómo manejar tokens expirados

BENEFICIOS:
- ✅ Experiencia de usuario ininterrumpida
- ✅ No más errores de "token expirado" durante el uso
- ✅ Transparente para el usuario final
- ✅ Fácil integración en aplicaciones existentes
- ✅ Control completo sobre el comportamiento de renovación
*/