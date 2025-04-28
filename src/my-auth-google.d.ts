declare module "my-auth-google" {
  const Auth: (apiKey: string, clientId: string) => Promise<boolean>;
  export default Auth;
}
