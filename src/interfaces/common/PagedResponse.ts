export interface PagedResponse<T> {
  contents: T[];
  paginaActual: number;
  tamanoPagina: number;
  totalElementos: number;
  totalPaginas: number;
}