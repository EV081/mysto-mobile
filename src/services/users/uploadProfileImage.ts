import Api from "@services/api";

export async function uploadProfileImage(imageUri: string) {
	try {
		const api = await Api.getInstance();
		const formData = new FormData();
		formData.append('file', {
			uri: imageUri,
			type: 'image/jpeg',
			name: 'profile_image.jpg',
		} as any);

		const response = await api.post<FormData, { url: string }>(formData, {
			url: `/user/profile-image`,
			headers: {
				'Content-Type': 'multipart/form-data',
			}
		});
		
		return response.data.url;
	} catch (error: any) {
		if (error.response?.status === 401 || error.response?.status === 403) {
			console.log('Token inválido o sin permisos, limpiando autenticación...');
			const api = await Api.getInstance();
			api.authorization = null;
		}
		console.error('Error uploading profile image:', error.response?.data || error.message);
		throw error;
	}
}