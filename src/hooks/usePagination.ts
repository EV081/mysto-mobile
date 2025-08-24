import { useState, useCallback } from 'react';
import { PagedResponse } from '@interfaces/common/PagedResponse';

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
}

export const usePagination = (initialPageSize: number = 6) => {
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: initialPageSize
  });

  const updatePagination = useCallback((data: PagedResponse<any>) => {
    setPagination({
  currentPage: data.page,
  totalPages: data.totalPages,
  totalElements: data.totalElements,
  pageSize: data.size
    });
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const resetPagination = useCallback(() => {
    setPagination(prev => ({ ...prev, currentPage: 0 }));
  }, []);

  const hasNextPage = pagination.currentPage < pagination.totalPages - 1;
  const hasPrevPage = pagination.currentPage > 0;
  const isFirstPage = pagination.currentPage === 0;
  const isLastPage = pagination.currentPage === pagination.totalPages - 1;

  return {
    ...pagination,
    updatePagination,
    setCurrentPage,
    resetPagination,
    hasNextPage,
    hasPrevPage,
    isFirstPage,
    isLastPage
  };
}; 