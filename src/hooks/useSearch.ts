import { useState, useCallback, useMemo } from 'react';

export const useSearch = <T>(
  data: T[],
  searchFields: (keyof T)[],
  debounceMs: number = 300
) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce effect
  const debouncedSetQuery = useCallback(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  // Actualizar query y aplicar debounce
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    debouncedSetQuery();
  }, [debouncedSetQuery]);

  // Limpiar búsqueda
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);

  // Filtrar datos basado en la query
  const filteredData = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return data;
    }

    const query = debouncedQuery.toLowerCase();
    return data.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        if (typeof value === 'number') {
          return value.toString().includes(query);
        }
        return false;
      });
    });
  }, [data, debouncedQuery, searchFields]);

  // Verificar si hay resultados
  const hasResults = filteredData.length > 0;
  const hasQuery = debouncedQuery.trim().length > 0;
  const resultCount = filteredData.length;

  return {
    searchQuery,
    debouncedQuery,
    filteredData,
    handleSearch,
    clearSearch,
    hasResults,
    hasQuery,
    resultCount
  };
}; 