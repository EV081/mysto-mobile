import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  role?: string;
  sub?: string;
  exp?: number;
}

/**
 * Extrae el rol del usuario desde el token JWT
 * @param token - Token JWT
 * @returns El rol del usuario o null si no se puede decodificar
 */
export function getRoleBasedOnToken(token: string): string | null {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.role || null;
  } catch (error) {
    console.error('Error al decodificar token:', error);
    return null;
  }
}

/**
 * Verifica si el token ha expirado
 * @param token - Token JWT
 * @returns true si el token ha expirado, false en caso contrario
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    if (!decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error al verificar expiración del token:', error);
    return true;
  }
}
