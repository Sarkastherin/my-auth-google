declare module "my-auth-google" {
  interface AuthOptions {
    /** Callback que se ejecuta cuando el token se renueva automáticamente */
    onTokenRefresh?: (token: any) => void;
    /** Si debe hacer auto-renovación del token (por defecto true) */
    autoRefresh?: boolean;
  }

  interface TokenStatus {
    /** Si el token es válido (no expira en los próximos 5 minutos) */
    valid: boolean;
    /** Si el token necesita renovación (expira en los próximos 10 minutos) */
    needsRefresh: boolean;
    /** Tiempo en milisegundos hasta que expire el token */
    timeUntilExpiry: number;
    /** El token actual (si existe) */
    token?: any;
  }

  const Auth: (apiKey: string, clientId: string, options?: AuthOptions) => Promise<boolean>;
  const Logout: () => boolean;
  const checkTokenStatus: () => TokenStatus;
  const forceTokenRefresh: () => Promise<boolean>;
  
  export default Auth;
  export { Logout, checkTokenStatus, forceTokenRefresh, AuthOptions, TokenStatus };
}
