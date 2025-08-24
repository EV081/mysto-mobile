import { createContext, ReactNode, useContext, useEffect, useCallback, useMemo } from "react";
import { AxiosResponse } from 'axios';
import { AuthResponse } from '@interfaces/auth/AuthResponse';
import { useStorageState } from "@hooks/useStorageState";
import { LoginRequest } from "@interfaces/auth/LoginRequest";
import { RegisterRequest } from "@interfaces/auth/RegisterRequest";
import Api from "@services/api";
import { login } from "@services/auth/login";
import { register } from "@services/auth/register";
import { 
  clearAuthToken, 
  saveCredentials, 
  getStoredCredentials, 
  isAutoLoginEnabled,
  disableAutoLogin,
  clearAllAuthData,
  initializeAuthCleanup
} from "@utils/authUtils";

interface AuthContextType {
  // register returns the created auth data (token)
  register: (SignupRequest: RegisterRequest) => Promise<AuthResponse>;
  // login returns the full axios response so callers can inspect status/data if needed
  login: (loginRequest: LoginRequest) => Promise<AxiosResponse<AuthResponse>>;
  logout: () => void | Promise<void>;
  autoLogin: () => Promise<boolean>;
  session?: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loginHandler(
  loginRequest: LoginRequest,
  setSession: (value: string | null) => void,
) {
  await clearAuthToken();
  // ensure session cleared before login
  await setSession(null);

  const response = await login(loginRequest);
  setSession(response.data.token);

  await saveCredentials(loginRequest.email, loginRequest.password);
  return response;
}

async function signupHandler(
  signupRequest: RegisterRequest,
  setSession: (value: string | null) => void,
) {
  await clearAuthToken();
  // await to ensure storage cleared
  await setSession(null);

  const response = await register(signupRequest);
  setSession(response.token);

  await saveCredentials(signupRequest.email, signupRequest.password);
  return response;
}

export function AuthProvider(props: { children: ReactNode }) {
  const [[isLoading, session], setSession] = useStorageState("token");

  console.log('[AuthProvider] render: isLoading=', isLoading, 'session=', session);

  useEffect(() => {
    initializeAuthCleanup();
  }, []);

  useEffect(() => {
    const syncTokenWithApi = async () => {
      try {
        const api = await Api.getInstance();
        api.authorization = session ?? null;
  console.log(session ? 'Token sincronizado con la API' : 'Token limpiado de la API');
      } catch (error) {
        console.error('Error al sincronizar token con API:', error);
      }
    };
    syncTokenWithApi();
  }, [session]);

  // === Callbacks ESTABLES ===
  const registerCb = useCallback(
  (signupRequest: RegisterRequest) => signupHandler(signupRequest, setSession),
    [setSession]
  );

  const loginCb = useCallback(
  (loginRequest: LoginRequest) => loginHandler(loginRequest, setSession),
    [setSession]
  );

  const logoutCb = useCallback(async () => {
    await clearAllAuthData();
    setSession(null);
  }, [setSession]);

  const autoLoginCb = useCallback(async (): Promise<boolean> => {
    try {
      const enabled = await isAutoLoginEnabled();
      if (!enabled) return false;

      const credentials = await getStoredCredentials();
      if (!credentials) return false;

      const response = await login({
        email: credentials.email,
        password: credentials.password
      });

      setSession(response.data.token);
      console.log('Auto-login exitoso');
      return true;
    } catch (error) {
      console.error('Error en auto-login:', error);
      await disableAutoLogin();
      return false;
    }
  }, [setSession]);

  // === value ESTABLE ===
  const value = useMemo<AuthContextType>(() => ({
    register: registerCb,
    login: loginCb,
    logout: logoutCb,
    autoLogin: autoLoginCb,
    session,
    isLoading,
  }), [registerCb, loginCb, logoutCb, autoLoginCb, session, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuthContext must be used within a AuthProvider");
  return context;
}
