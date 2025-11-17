const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC_GMAIL = "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest";
const DISCOVERY_DOC_SHEET = "https://sheets.googleapis.com/$discovery/rest?version=v4";
const DISCOVERY_DOC_DRIVE = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

let tokenClient;
let gapiInited = false;
let gisInited = false;
let tokenMonitorInterval = null;
let onTokenRefreshCallback = null;

function gapiLoaded(apiKey) {
  return new Promise((resolve) => {
    gapi.load("client", async () => {
      await gapi.client.init({
        apiKey: apiKey,
        discoveryDocs: [DISCOVERY_DOC_GMAIL, DISCOVERY_DOC_SHEET, DISCOVERY_DOC_DRIVE],
      });
      gapiInited = true;
      resolve();
    });
  });
}

function gisLoaded(client_id) {
  return new Promise((resolve) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: client_id,
      scope: SCOPES,
      callback: "", 
    });
    gisInited = true;
    resolve();
  });
}

// Función para verificar si el token sigue siendo válido
function isTokenValid(token) {
  if (!token || !token.expires_in || !token.created_at) {
    return false;
  }

  const expiresInMs = token.expires_in * 1000;
  const expiresAt = token.created_at + expiresInMs;
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  return (expiresAt - now) > fiveMinutes;
}

// Función para verificar si el token necesita renovación (10 minutos antes de expirar)
function needsTokenRefresh(token) {
  if (!token || !token.expires_in || !token.created_at) {
    return true;
  }

  const expiresInMs = token.expires_in * 1000;
  const expiresAt = token.created_at + expiresInMs;
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000; // Renovar 10 minutos antes de expirar

  return (expiresAt - now) <= tenMinutes;
}

// Función para renovar el token silenciosamente
async function refreshTokenSilently() {
  return new Promise((resolve, reject) => {
    if (!tokenClient || !gapiInited || !gisInited) {
      reject(new Error("Cliente no inicializado"));
      return;
    }

    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        console.error("Error renovando token:", resp.error);
        reject(resp.error);
      } else {
        let token = gapi.client.getToken();
        if (token) {
          // Guardar token renovado
          token.created_at = Date.now();
          localStorage.setItem("google_auth_token", JSON.stringify(token));
          
          // Notificar que el token se renovó
          if (onTokenRefreshCallback) {
            onTokenRefreshCallback(token);
          }
          
          console.log("Token renovado automáticamente");
          resolve(true);
        } else {
          reject(new Error("No se pudo obtener el token renovado"));
        }
      }
    };

    // Solicitar renovación sin mostrar consent (solo si ya se otorgó previamente)
    tokenClient.requestAccessToken({ prompt: "" });
  });
}

// Función para monitorear y renovar el token automáticamente
function startTokenMonitoring() {
  // Limpiar monitor existente si existe
  if (tokenMonitorInterval) {
    clearInterval(tokenMonitorInterval);
  }

  // Verificar cada 5 minutos
  tokenMonitorInterval = setInterval(async () => {
    try {
      const savedToken = localStorage.getItem("google_auth_token");
      if (savedToken) {
        const parsedToken = JSON.parse(savedToken);
        
        if (needsTokenRefresh(parsedToken)) {
          console.log("Token necesita renovación, renovando automáticamente...");
          await refreshTokenSilently();
        }
      }
    } catch (error) {
      console.error("Error en el monitoreo automático del token:", error);
      // Si falla la renovación automática, se podría notificar a la aplicación
      // para que maneje la re-autenticación manual si es necesario
    }
  }, 5 * 60 * 1000); // Cada 5 minutos
}

// Función para detener el monitoreo del token
function stopTokenMonitoring() {
  if (tokenMonitorInterval) {
    clearInterval(tokenMonitorInterval);
    tokenMonitorInterval = null;
  }
}


// Función para verificar autenticación sin solicitar permisos
function checkExistingAuth() {
  return new Promise((resolve) => {
    const savedToken = localStorage.getItem("google_auth_token");
    if (savedToken) {
      try {
        const parsedToken = JSON.parse(savedToken);
        if (isTokenValid(parsedToken)) {
          gapi.client.setToken(parsedToken);
          resolve(true);
          return;
        }
      } catch (e) {
        localStorage.removeItem("google_auth_token");
      }
    }
    resolve(false);
  });
}

function handleAuthClick() {
  return new Promise((resolve, reject) => {
    if (gapiInited && gisInited) {
      tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
          reject(resp.error);
        } else {
          let token = gapi.client.getToken();
          if (token) {
            // Guardar token como string JSON
            token.created_at = Date.now();
            localStorage.setItem("google_auth_token", JSON.stringify(token));
          }
          resolve(true);
        }
      };
      
      // Intentar cargar token existente
      const savedToken = localStorage.getItem("google_auth_token");
      if (savedToken) {
        try {
          const parsedToken = JSON.parse(savedToken);
          gapi.client.setToken(parsedToken);
          
          // Verificar si el token sigue siendo válido
          if (isTokenValid(parsedToken)) {
            resolve(true);
            return;
          }
        } catch (e) {
          console.log("Token guardado inválido, solicitando nuevo");
          localStorage.removeItem("google_auth_token");
        }
      }
      
      // Si no hay token válido, solicitar uno nuevo
      tokenClient.requestAccessToken({ prompt: "consent" });
    }
  });
}

const Auth = async (apiKey, client_id, options = {}) => {
  try {
    await gapiLoaded(apiKey);
    await gisLoaded(client_id);
    
    // Configurar callback de renovación si se proporciona
    if (options.onTokenRefresh && typeof options.onTokenRefresh === 'function') {
      onTokenRefreshCallback = options.onTokenRefresh;
    }
    
    // Primero verificar si ya hay una sesión válida
    const existingAuth = await checkExistingAuth();
    if (existingAuth) {
      // Iniciar monitoreo automático del token
      if (options.autoRefresh !== false) { // Por defecto true, se puede desactivar
        startTokenMonitoring();
      }
      return true;
    }
    
    // Si no hay sesión válida, solicitar nueva autenticación
    const authResult = await handleAuthClick();
    
    // Si la autenticación fue exitosa, iniciar monitoreo
    if (authResult && options.autoRefresh !== false) {
      startTokenMonitoring();
    }
    
    return authResult;
  } catch (error) {
    console.error("Error during authentication", error);
    return false;
  }
};

// Función para hacer logout
const Logout = () => {
  try {
    // Detener monitoreo automático
    stopTokenMonitoring();
    
    // Limpiar callback de renovación
    onTokenRefreshCallback = null;
    
    // Limpiar token de Google API
    if (gapi && gapi.client) {
      gapi.client.setToken(null);
    }
    
    // Limpiar localStorage
    localStorage.removeItem("google_auth_token");
    
    return true;
  } catch (error) {
    console.error("Error during logout", error);
    return false;
  }
};

// Función para verificar manualmente el estado del token
const checkTokenStatus = () => {
  try {
    const savedToken = localStorage.getItem("google_auth_token");
    if (!savedToken) {
      return { valid: false, needsRefresh: true, timeUntilExpiry: 0 };
    }

    const parsedToken = JSON.parse(savedToken);
    const valid = isTokenValid(parsedToken);
    const needsRefresh = needsTokenRefresh(parsedToken);
    
    let timeUntilExpiry = 0;
    if (parsedToken.expires_in && parsedToken.created_at) {
      const expiresAt = parsedToken.created_at + (parsedToken.expires_in * 1000);
      timeUntilExpiry = Math.max(0, expiresAt - Date.now());
    }
    
    return {
      valid,
      needsRefresh,
      timeUntilExpiry,
      token: parsedToken
    };
  } catch (error) {
    console.error("Error checking token status:", error);
    return { valid: false, needsRefresh: true, timeUntilExpiry: 0 };
  }
};

// Función para forzar renovación manual del token
const forceTokenRefresh = async () => {
  try {
    await refreshTokenSilently();
    return true;
  } catch (error) {
    console.error("Error forzando renovación del token:", error);
    return false;
  }
};

export default Auth;
export { Logout, checkTokenStatus, forceTokenRefresh };