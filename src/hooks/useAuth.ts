import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuthContext } from '@contexts/AuthContext';
import { LoginRequest } from '@interfaces/auth/LoginRequest';

interface UseAuthOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  redirectTo?: string;
}

export function useAuthState() {
  const context = useAuthContext();
  
  // Verificar si el usuario está autenticado
  const isAuthenticated = !!context.session;
  
  // Verificar si está cargando
  const isLoading = context.isLoading;
  
  return {
    ...context,
    isAuthenticated,
    isLoading,
  };
}

export function useAuth(options: UseAuthOptions = {}) {
  const { login: authLogin } = useAuthContext();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { onSuccess, onError, redirectTo = 'Main' } = options;

  /**
   * Realiza login con credenciales personalizadas
   * @param credentials - Credenciales del usuario (email, password)
   */
  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      await authLogin(credentials);
      
      if (onSuccess) {
        onSuccess();
      } else if (redirectTo && redirectTo !== 'Main' && navigation) {
        try {
          navigation.navigate(redirectTo as never);
        } catch (navError) {
          console.warn('Error al navegar:', navError);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Realiza login automático como viewer usando credenciales del backend
   * Lee las variables de entorno VITE_VIEWER_EMAIL y VITE_VIEWER_PASSWORD
   */
  const loginAsViewer = async () => {
    const viewerEmail = process.env.EXPO_PUBLIC_VIEWER_EMAIL;
    const viewerPassword = process.env.EXPO_PUBLIC_VIEWER_PASSWORD;
    
    if (!viewerEmail || !viewerPassword) {
      setError('Credenciales de viewer no configuradas');
      return;
    }

    await login({
      email: viewerEmail,
      password: viewerPassword
    });
  };

  return {
    login,
    loginAsViewer,
    isLoading,      // Para mostrar spinners/pantallas de carga
    error,          // Para mostrar mensajes de error
    clearError: () => setError(null)
  };
} 