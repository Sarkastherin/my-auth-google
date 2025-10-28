# Paquete de Autenticación con Google

Este paquete permite la autenticación con las APIs de Google, específicamente para acceder a Gmail y Google Sheets, utilizando las bibliotecas `gapi` y `google.accounts.oauth2`. 

## ✨ Características Principales

- 🔄 **Auto-renovación automática de tokens** - Los tokens se renuevan automáticamente sin interrumpir al usuario
- ⏰ **Monitoreo inteligente** - Verifica el estado del token cada 5 minutos
- 🔔 **Callbacks personalizables** - Recibe notificaciones cuando se renueve el token
- 🛡️ **Manejo robusto de errores** - Gestión completa de casos de fallo
- 📊 **Utilidades de estado** - Funciones para verificar y controlar el token
- 🎯 **Fácil integración** - Compatible con React, Vue, Angular y vanilla JS

## Instalación

Puedes instalar el paquete usando npm o yarn:

### Con npm

```bash
npm install mi-paquete-google-auth
```

## Uso Básico

### Paso 1: Incluir los Scripts de Google
Antes de usar el paquete, asegúrate de incluir los siguientes scripts de Google en el archivo HTML de tu aplicación:

```html
<script async defer src="https://apis.google.com/js/api.js"></script>
<script async defer src="https://accounts.google.com/gsi/client"></script>
```

### Paso 2: Uso Simple (Sin Auto-renovación)
```javascript
import Auth, { Logout } from 'mi-paquete-google-auth';

const apiKey = 'tu-api-key';
const clientId = 'tu-client-id';

const authenticate = async () => {
  const authResult = await Auth(apiKey, clientId);
  if (authResult) {
    console.log('Autenticación exitosa');
  } else {
    console.log('Error en la autenticación');
  }
};

authenticate();
```

## 🚀 Uso Avanzado con Auto-renovación

### Configuración Completa
```javascript
import Auth, { Logout, checkTokenStatus, forceTokenRefresh } from 'mi-paquete-google-auth';

const apiKey = 'tu-api-key';
const clientId = 'tu-client-id';

// Callback que se ejecuta cuando el token se renueva automáticamente
function onTokenRefreshed(newToken) {
  console.log('Token renovado automáticamente:', newToken);
  // Actualizar UI, estado de la app, etc.
  updateUserInterface('Token renovado');
}

const authenticateWithAutoRefresh = async () => {
  try {
    const authResult = await Auth(apiKey, clientId, {
      autoRefresh: true,              // Habilitar auto-renovación (por defecto)
      onTokenRefresh: onTokenRefreshed // Callback cuando se renueve
    });
    
    if (authResult) {
      console.log('✅ Autenticación exitosa con auto-renovación habilitada');
      
      // Verificar estado del token
      const status = checkTokenStatus();
      console.log('Estado del token:', status);
    }
  } catch (error) {
    console.error('Error en autenticación:', error);
  }
};

authenticateWithAutoRefresh();
```

### Funciones de Utilidad

#### `checkTokenStatus()`
Verifica el estado actual del token:

```javascript
import { checkTokenStatus } from 'mi-paquete-google-auth';

const status = checkTokenStatus();
console.log({
  valid: status.valid,           // true si el token es válido
  needsRefresh: status.needsRefresh, // true si necesita renovación pronto
  timeUntilExpiry: status.timeUntilExpiry // milisegundos hasta expirar
});
```

#### `forceTokenRefresh()`
Fuerza una renovación manual del token:

```javascript
import { forceTokenRefresh } from 'mi-paquete-google-auth';

const refreshButton = document.getElementById('refresh-token');
refreshButton.addEventListener('click', async () => {
  try {
    const success = await forceTokenRefresh();
    if (success) {
      console.log('Token renovado manualmente');
    }
  } catch (error) {
    console.error('Error renovando token:', error);
  }
});
```

#### `Logout()`
Cierra sesión y detiene el monitoreo automático:

```javascript
import { Logout } from 'mi-paquete-google-auth';

const logoutButton = document.getElementById('logout');
logoutButton.addEventListener('click', () => {
  const success = Logout();
  if (success) {
    console.log('Sesión cerrada exitosamente');
    // Redirigir a login o actualizar UI
  }
});
```

## 🔧 Configuración de Opciones

```typescript
interface AuthOptions {
  /** Callback que se ejecuta cuando el token se renueva automáticamente */
  onTokenRefresh?: (token: any) => void;
  /** Si debe hacer auto-renovación del token (por defecto true) */
  autoRefresh?: boolean;
}
```

## 📋 Ejemplos de Integración

### Con React
```jsx
import React, { useEffect, useState } from 'react';
import Auth, { checkTokenStatus, Logout } from 'mi-paquete-google-auth';

function AuthComponent() {
  const [tokenStatus, setTokenStatus] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleTokenRefresh = (newToken) => {
    console.log('Token renovado:', newToken);
    setTokenStatus(checkTokenStatus());
  };

  useEffect(() => {
    const initAuth = async () => {
      const success = await Auth('api-key', 'client-id', {
        autoRefresh: true,
        onTokenRefresh: handleTokenRefresh
      });
      
      setIsAuthenticated(success);
      if (success) {
        setTokenStatus(checkTokenStatus());
      }
    };

    initAuth();

    // Cleanup al desmontar
    return () => {
      // El cleanup automático se maneja internamente
    };
  }, []);

  return (
    <div>
      <h2>Estado de Autenticación</h2>
      <p>Autenticado: {isAuthenticated ? '✅' : '❌'}</p>
      {tokenStatus && (
        <div>
          <p>Token válido: {tokenStatus.valid ? '✅' : '❌'}</p>
          <p>Tiempo hasta expirar: {Math.round(tokenStatus.timeUntilExpiry / 1000 / 60)} minutos</p>
        </div>
      )}
      <button onClick={() => Logout()}>Cerrar Sesión</button>
    </div>
  );
}
```

### Con Vue.js
```vue
<template>
  <div>
    <h2>Google Auth Status</h2>
    <p>Autenticado: {{ isAuthenticated ? '✅' : '❌' }}</p>
    <div v-if="tokenStatus">
      <p>Token válido: {{ tokenStatus.valid ? '✅' : '❌' }}</p>
      <p>Expira en: {{ timeUntilExpiryMinutes }} minutos</p>
    </div>
    <button @click="logout">Cerrar Sesión</button>
  </div>
</template>

<script>
import Auth, { checkTokenStatus, Logout } from 'mi-paquete-google-auth';

export default {
  data() {
    return {
      isAuthenticated: false,
      tokenStatus: null
    };
  },
  
  computed: {
    timeUntilExpiryMinutes() {
      return this.tokenStatus 
        ? Math.round(this.tokenStatus.timeUntilExpiry / 1000 / 60)
        : 0;
    }
  },
  
  async mounted() {
    const success = await Auth('api-key', 'client-id', {
      autoRefresh: true,
      onTokenRefresh: this.handleTokenRefresh
    });
    
    this.isAuthenticated = success;
    if (success) {
      this.tokenStatus = checkTokenStatus();
    }
  },
  
  methods: {
    handleTokenRefresh(newToken) {
      console.log('Token renovado:', newToken);
      this.tokenStatus = checkTokenStatus();
    },
    
    logout() {
      const success = Logout();
      if (success) {
        this.isAuthenticated = false;
        this.tokenStatus = null;
      }
    }
  }
};
</script>
```

## ⚙️ Cómo Funciona la Auto-renovación

1. **Inicialización**: Al autenticarse exitosamente, se inicia un monitor que verifica el token cada 5 minutos
2. **Verificación**: Se verifica si el token expira en los próximos 10 minutos
3. **Renovación Silenciosa**: Si necesita renovación, se solicita automáticamente un nuevo token sin intervención del usuario
4. **Callback**: Si se configuró, se ejecuta el callback `onTokenRefresh` con el nuevo token
5. **Persistencia**: El nuevo token se guarda automáticamente en localStorage
6. **Continuidad**: El proceso continúa hasta que el usuario cierre sesión o cierre la aplicación

## 🔒 Consideraciones de Seguridad

- Los tokens se almacenan en localStorage del navegador
- La renovación automática solo funciona si el usuario otorgó permisos previamente
- Si falla la renovación automática, se registra el error pero no se interrumpe la aplicación
- Al cerrar sesión, se limpia toda la información de tokens y se detiene el monitoreo

## 📚 API Reference

### `Auth(apiKey, clientId, options?)`
- **apiKey**: String - La clave de API de Google
- **clientId**: String - El ID de cliente de OAuth
- **options**: Object (opcional)
  - `autoRefresh`: Boolean (default: true) - Habilitar auto-renovación
  - `onTokenRefresh`: Function - Callback cuando se renueve el token
- **Returns**: Promise<Boolean> - true si la autenticación fue exitosa

### `Logout()`
- **Returns**: Boolean - true si el logout fue exitoso

### `checkTokenStatus()`
- **Returns**: Object - Estado actual del token
  - `valid`: Boolean - Si el token es válido
  - `needsRefresh`: Boolean - Si necesita renovación
  - `timeUntilExpiry`: Number - Milisegundos hasta expirar
  - `token`: Object - El token actual (si existe)

### `forceTokenRefresh()`
- **Returns**: Promise<Boolean> - true si la renovación fue exitosa

## 🐛 Solución de Problemas

### El token no se renueva automáticamente
- Verifica que `autoRefresh` esté en `true` (es el valor por defecto)
- Asegúrate de que el usuario haya otorgado permisos previamente
- Revisa la consola para errores de renovación

### Errores de CORS
- Asegúrate de que tu dominio esté configurado en Google Cloud Console
- Verifica que los scripts de Google estén cargados correctamente

### El callback no se ejecuta
- Verifica que la función `onTokenRefresh` sea válida
- Asegúrate de que la autenticación inicial haya sido exitosa

## 📝 Licencia

MIT License

El paquete almacenará el token de autenticación en el localStorage para su posterior uso.
## Características
- Autenticación con Gmail y Google Sheets.
- Uso de Google OAuth 2.0 para la autenticación.
- Almacenamiento del token en el localStorage para mantener la sesión activa.
## Licencia
Este proyecto está licenciado bajo la [MIT](https://choosealicense.com/licenses/mit/) License.
## Autor
- [@sarkatherin](https://www.github.com/sarkastherin)
## 🔗 Links
- [API Google Sheets, guía de inicio rápido](https://developers.google.com/workspace/sheets/api/quickstart/js?hl=es-419)
- [Repositorio](https://github.com/Sarkastherin/my-auth-google)

