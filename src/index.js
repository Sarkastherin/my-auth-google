const SCOPES = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC_GMAIL = "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest";
const DISCOVERY_DOC_SHEET = "https://sheets.googleapis.com/$discovery/rest?version=v4";

let tokenClient;
let gapiInited = false;
let gisInited = false;

function gapiLoaded(apiKey) {
  return new Promise((resolve) => {
    gapi.load("client", async () => {
      await gapi.client.init({
        apiKey: apiKey,
        discoveryDocs: [DISCOVERY_DOC_GMAIL, DISCOVERY_DOC_SHEET],
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


// Función para verificar autenticación sin solicitar permisos
function checkExistingAuth() {
  return new Promise((resolve) => {
    const savedToken = localStorage.getItem("google_auth_token");
    if (savedToken) {
      try {
        const parsedToken = JSON.parse(savedToken);
        if (isTokenValid(parsedToken)) {
          console.log("Using existing valid token");
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

const Auth = async (apiKey, client_id) => {
  try {
    await gapiLoaded(apiKey);
    await gisLoaded(client_id);
    
    // Primero verificar si ya hay una sesión válida
    const existingAuth = await checkExistingAuth();
    console.log("Existing Auth:", existingAuth);
    if (existingAuth) {
      return true;
    }
    
    // Si no hay sesión válida, solicitar nueva autenticación
    const authResult = await handleAuthClick();
    return authResult;
  } catch (error) {
    console.error("Error during authentication", error);
    return false;
  }
};

// Función para hacer logout
const Logout = () => {
  try {
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

export default Auth;
export { Logout };