export interface PaginatedResponse<T> {
    contents: T[];
    page: number;
    totalPages: number;
    totalElements: number;
    size: number;
}