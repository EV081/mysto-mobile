import AsyncStorage from '@react-native-async-storage/async-storage';

export * from './getRoleBasedOnToken';
/**
 * Limpia el token de autenticación tanto del AsyncStorage como de la instancia de API
 * Esta función asegura que no haya tokens residuales antes de hacer login/registro
 */
export async function clearAuthToken(): Promise<void> {
	// Limpiar del AsyncStorage
	await AsyncStorage.removeItem('token');
	
	// Limpiar de la instancia de API
	const Api = (await import('@services/api')).default;
	const api = await Api.getInstance();
	api.authorization = null;
} 