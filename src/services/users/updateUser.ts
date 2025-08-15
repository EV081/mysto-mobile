import { UsersResponseDto } from "@interfaces/user/UsersResponseDto";
import { UpdateUserRequestDto } from "@interfaces/user/UpdateUserRequestDto";
import Api from "@services/api";


export async function updateUser(userId: number, userData: UpdateUserRequestDto) {
	try {
		const api = await Api.getInstance();
		const response = await api.put<UpdateUserRequestDto, UsersResponseDto>(userData, {
			url: `/user/${userId}`
		});
		return response;
	} catch (error: any) {
		if (error.response?.status === 401 || error.response?.status === 403) {
			console.log('Token inválido o sin permisos, limpiando autenticación...');
			const api = await Api.getInstance();
			api.authorization = null;
		}
		throw error;
	}
}