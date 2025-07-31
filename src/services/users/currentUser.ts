import { UsersResponseDto } from "@interfaces/user/UsersResponseDto";
import Api from "@services/api";

export async function getCurrentUser() {
	try {
		const api = await Api.getInstance();
		const response = await api.get<void, UsersResponseDto>({
			url: "/users/me"
		});
		return response;
	} catch (error: any) {
		// Si el error es 401 o 403, el token es inválido
		if (error.response?.status === 401 || error.response?.status === 403) {
			console.log('Token inválido, limpiando autenticación...');
			// Limpiar el token de la instancia de API
			const api = await Api.getInstance();
			api.authorization = null;
		}
		throw error;
	}
}
