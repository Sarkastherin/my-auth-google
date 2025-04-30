const SCOPES = 'https://mail.google.com/ https://www.googleapis.com/auth/spreadsheets';
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

function handleAuthClick() {
  return new Promise((resolve, reject) => {
    if (gapiInited && gisInited) {
      tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
          reject(resp.error);
        } else {
          let token = gapi.client.getToken();
          if (!localStorage.getItem("token")) {
            localStorage.setItem("token", token);
          }
          resolve(true);
        }
      };
      gapi.client.setToken(localStorage.getItem("token"));
      if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: "consent" });
      } else {
        tokenClient.requestAccessToken({ prompt: "" });
      }
    }
  });
}

const Auth = async (apiKey, client_id) => {
  try {
    await gapiLoaded(apiKey);
    await gisLoaded(client_id);
    const authResult = await handleAuthClick();
    return authResult;
  } catch (error) {
    console.error("Error during authentication", error);
    return false;
  }
};
export default Auth;