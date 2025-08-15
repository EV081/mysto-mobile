export interface UsersResponseDto {
	id: number;
	email: string;
	name: string;
	coins: number;
	points: number;
	role: UserRole;
	url_image?: string;
}

export type UserRole = 'COLLAB' | 'CUSTOMER';