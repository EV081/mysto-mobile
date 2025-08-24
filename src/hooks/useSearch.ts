import { useEffect, useMemo, useState } from 'react';

type Keys = string[];

export function useSearch<T extends Record<string, any>>(
  data: T[],
  keys: Keys
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<T[]>(data);

  const norm = (v: any) =>
    (v ?? '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  useEffect(() => {
    if (!searchQuery) {
      setFilteredData(data);
      return;
    }
    const q = norm(searchQuery);
    const next = data.filter((item) =>
      keys.some((k) => norm(item[k]).includes(q))
    );
    setFilteredData(next);
  }, [data, searchQuery, keys]);

  const handleSearch = (q: string) => setSearchQuery(q);
  const clearSearch = () => setSearchQuery('');

  return {
    filteredData,
    searchQuery,
    handleSearch,
    clearSearch,
    isSearching: !!searchQuery,
  };
}
