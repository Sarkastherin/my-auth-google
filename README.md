# Paquete de Autenticación con Google

Este paquete permite la autenticación con las APIs de Google, específicamente para acceder a Gmail y Google Sheets, utilizando las bibliotecas `gapi` y `google.accounts.oauth2`.

## Instalación

Puedes instalar el paquete usando npm o yarn:

### Con npm

```bash
npm install mi-paquete-google-auth
```
## Uso

### Paso 1: Incluir los Scripts de Google
Antes de usar el paquete, asegúrate de incluir los siguientes scripts de Google en el archivo HTML de tu aplicación. Esto es necesario para cargar las bibliotecas de `gapi` y `google.accounts.oauth2`.

```html
<script async defer src="https://apis.google.com/js/api.js"></script>
<script async defer src="https://accounts.google.com/gsi/client"></script>

```
### Paso 2: Importar y Usar el Paquete
Una vez que hayas instalado el paquete y añadido los scripts en tu HTML, puedes usarlo de la siguiente manera:
```javascript
import Auth from 'mi-paquete-google-auth';

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
## Parámetros
- **apiKey:** La clave de API proporcionada por Google.
- **clientId:** El ID de cliente de tu aplicación en Google Cloud.
## Cómo Funciona
1. **gapiLoaded:** Carga el cliente de Google API y se asegura de que las bibliotecas necesarias estén inicializadas.
2. **gisLoaded:** Inicializa el cliente de autenticación de Google.
3. **handleAuthClick:** Solicita al usuario autorización para acceder a sus cuentas de Gmail y Google Sheets.

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

