declare module "my-auth-google" {
  const Auth: (apiKey: string, clientId: string) => Promise<boolean>;
  const Logout: () => boolean;
  export default Auth;
  export { Logout };
}
