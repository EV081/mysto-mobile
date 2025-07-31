import AsyncStorage from '@react-native-async-storage/async-storage';
import Api from '@services/api';
import { getCurrentUser } from '@services/users/currentUser';

// Claves para AsyncStorage
const TOKEN_KEY = 'token';
const CREDENTIALS_KEY = 'credentials';
const AUTO_LOGIN_KEY = 'autoLogin';

interface StoredCredentials {
  email: string;
  password: string;
}

/**
 * Limpia el token de autenticación tanto del AsyncStorage como de la instancia de API
 * Esta función asegura que no haya tokens residuales antes de hacer login/registro
 */
export async function clearAuthToken(): Promise<void> {
  try {
    // Limpiar del AsyncStorage
    await AsyncStorage.removeItem(TOKEN_KEY);
    
    // Limpiar de la instancia de API
    const api = await Api.getInstance();
    api.authorization = null;
    
    console.log('Token de autenticación limpiado correctamente');
  } catch (error) {
    console.error('Error al limpiar token:', error);
  }
}

/**
 * Guarda las credenciales del usuario para auto-login
 */
export async function saveCredentials(email: string, password: string): Promise<void> {
  try {
    const credentials: StoredCredentials = { email, password };
    await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
    await AsyncStorage.setItem(AUTO_LOGIN_KEY, 'true');
    console.log('Credenciales guardadas para auto-login');
  } catch (error) {
    console.error('Error al guardar credenciales:', error);
  }
}

/**
 * Obtiene las credenciales guardadas
 */
export async function getStoredCredentials(): Promise<StoredCredentials | null> {
  try {
    const credentialsStr = await AsyncStorage.getItem(CREDENTIALS_KEY);
    if (credentialsStr) {
      return JSON.parse(credentialsStr) as StoredCredentials;
    }
    return null;
  } catch (error) {
    console.error('Error al obtener credenciales:', error);
    return null;
  }
}

/**
 * Verifica si el auto-login está habilitado
 */
export async function isAutoLoginEnabled(): Promise<boolean> {
  try {
    const autoLogin = await AsyncStorage.getItem(AUTO_LOGIN_KEY);
    return autoLogin === 'true';
  } catch (error) {
    console.error('Error al verificar auto-login:', error);
    return false;
  }
}

/**
 * Deshabilita el auto-login y limpia las credenciales
 */
export async function disableAutoLogin(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CREDENTIALS_KEY);
    await AsyncStorage.removeItem(AUTO_LOGIN_KEY);
    console.log('Auto-login deshabilitado');
  } catch (error) {
    console.error('Error al deshabilitar auto-login:', error);
  }
}

/**
 * Limpia todos los datos de autenticación
 */
export async function clearAllAuthData(): Promise<void> {
  try {
    await clearAuthToken();
    await disableAutoLogin();
    console.log('Todos los datos de autenticación limpiados');
  } catch (error) {
    console.error('Error al limpiar datos de autenticación:', error);
  }
}

/**
 * Inicializa la limpieza del token al abrir la app
 * Esta función debe llamarse al inicio de la aplicación
 */
export async function initializeAuthCleanup(): Promise<void> {
  try {
    console.log('Inicializando limpieza de autenticación...');
    
    // Verificar si hay un token almacenado
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    
    if (token) {
      // Si hay token, validarlo antes de decidir si limpiarlo
      const api = await Api.getInstance();
      api.authorization = token;
      
      // Intentar validar el token haciendo una petición de prueba
      try {
        // Usar el servicio getCurrentUser para validar el token
        await getCurrentUser();
        console.log('Token válido encontrado, manteniendo sesión');
        return; // No limpiar si el token es válido
      } catch (error: any) {
        console.log('Token inválido o expirado, limpiando...');
        // Solo limpiar si el token es inválido
        await clearAuthToken();
      }
    } else {
      console.log('No hay token almacenado');
    }
    
    console.log('Limpieza de autenticación completada');
  } catch (error) {
    console.error('Error en la limpieza inicial de autenticación:', error);
  }
}

/**
 * Valida si un token existe y no ha expirado
 */
export async function validateStoredToken(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) {
      return false;
    }

    // Aquí podrías agregar validación adicional del token
    // Por ejemplo, verificar si no ha expirado
    const api = await Api.getInstance();
    api.authorization = token;
    
    // Intentar hacer una llamada de prueba para validar el token
    // Esto dependerá de tu API
    return true;
  } catch (error) {
    console.error('Error al validar token:', error);
    return false;
  }
} 