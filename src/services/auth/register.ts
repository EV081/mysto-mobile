import { RegisterRequest } from "@interfaces/auth/RegisterRequest";
import { AuthResponse } from "@interfaces/auth/AuthResponse";
import Api from "@services/api";

export async function register(registerRequest: RegisterRequest) {
	const api = await Api.getInstance();
	
	// Limpiar autorización anterior antes de hacer registro
	api.authorization = null;
	
	const response = await api.post<RegisterRequest, AuthResponse>(
		registerRequest,
		{ url: "/auth/signup" }
	);
	api.authorization = response.data.token;
	return response;
}