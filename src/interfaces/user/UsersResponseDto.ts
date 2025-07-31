export interface UsersResponseDto {
	id: number;
	email: string;
	name: string;
	coins: number;
	points: number;
	role: UserRole;
}

export type UserRole = 'COLLAB' | 'CUSTOMER';