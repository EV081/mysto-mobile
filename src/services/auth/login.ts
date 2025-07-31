import { LoginRequest } from "@interfaces/auth/LoginRequest";
import { AuthResponse } from "@interfaces/auth/AuthResponse";
import Api from "@services/api";

export async function login(loginRequest: LoginRequest) {
	const api = await Api.getInstance();
	
	// Limpiar autorización anterior antes de hacer login
	api.authorization = null;
	
	const response = await api.post<LoginRequest, AuthResponse>(
		loginRequest,
		{ url: "/auth/login" }
	);
    api.authorization = response.data.token;
	return response;
}