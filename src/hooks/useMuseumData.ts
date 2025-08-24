import { useState, useEffect, useCallback, useRef } from 'react';
import { getMuseumForId } from '@services/museum/getMuseumforId';
import { getPagedMuseums } from '@services/culturalObject/getListarCulturalObject';
import { getObjectsByMuseumId } from '@services/museum/getListarObjetsforMuseum';
import { deleteMuseum } from '@services/museum/delteMuseum';
import { deleteCulturalObject } from '@services/culturalObject/deleteCulturalObject';
import { PagedResponse } from '@interfaces/common/PagedResponse';
import { CulturalObjectResponse } from '@interfaces/cuturalObject/CulturalObjectResponse';
import { MuseumResponse } from '@interfaces/museum/MuseumResponse';

export const useMuseumData = (museumId: number, onMuseumDeleted?: () => void) => {
  const [museum, setMuseum] = useState<MuseumResponse | null>(null);
  const [objects, setObjects] = useState<CulturalObjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredObjects, setFilteredObjects] = useState<CulturalObjectResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const pageSize = 6;
  const isInitialLoad = useRef(true);
  const lastMuseumId = useRef<number | null>(null);

  // Cargar datos del museo
  const loadMuseumData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMuseumForId(museumId);
      setMuseum(response.data);
      
  const data: PagedResponse<CulturalObjectResponse> = await getPagedMuseums(museumId, 0, pageSize);
  setObjects(data.contents);
  setCurrentPage(data.page);
  setTotalPages(data.totalPages);
  setTotalElements(data.totalElements);
      setFilteredObjects(data.contents);
    } catch (e) {
      console.error('Error loading museum data:', e);
    }
    setLoading(false);
  }, [museumId]);

  // Cargar objetos de una página específica
  const loadPageObjects = useCallback(async (page: number) => {
    try {
  const data: PagedResponse<CulturalObjectResponse> = await getPagedMuseums(museumId, page, pageSize);
  setObjects(data.contents);
  setCurrentPage(data.page);
  setTotalPages(data.totalPages);
  setTotalElements(data.totalElements);
      if (!searchQuery) {
        setFilteredObjects(data.contents);
      }
    } catch (e) {
      console.error('Error loading page objects:', e);
    }
  }, [museumId, searchQuery]);

  // Refrescar datos
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [museumResponse, objectsResponse] = await Promise.all([
        getMuseumForId(museumId),
        getPagedMuseums(museumId, currentPage, pageSize)
      ]);
      setMuseum(museumResponse.data);
  setObjects(objectsResponse.contents);
  setCurrentPage(objectsResponse.page);
  setTotalPages(objectsResponse.totalPages);
  setTotalElements(objectsResponse.totalElements);
      if (!searchQuery) {
        setFilteredObjects(objectsResponse.contents);
      }
    } catch (e) {
      console.error('Error refreshing data:', e);
    }
    setRefreshing(false);
  }, [museumId, currentPage, searchQuery]);

  // Manejar búsqueda
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      setIsSearching(true);
      try {
        const allObjectsData = await getObjectsByMuseumId(museumId);
        const filtered = allObjectsData.filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredObjects(filtered);
      } catch (e) {
        console.error('Error searching objects:', e);
        setFilteredObjects([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setFilteredObjects(objects);
    }
  }, [museumId, objects]);

  // Limpiar búsqueda
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilteredObjects(objects);
  }, [objects]);

  // Cambiar página
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    loadPageObjects(page);
  }, [loadPageObjects]);

  // Eliminar museo
  const handleDeleteMuseum = useCallback(async () => {
    try {
      await deleteMuseum(museumId);
      if (onMuseumDeleted) {
        onMuseumDeleted();
      }
      return true;
    } catch (error) {
      console.error('Error deleting museum:', error);
      return false;
    }
  }, [museumId, onMuseumDeleted]);

  // Eliminar objeto cultural
  const handleDeleteCulturalObject = useCallback(async (objectId: number) => {
    try {
      await deleteCulturalObject(objectId);
      await loadPageObjects(currentPage);
      return true;
    } catch (error) {
      console.error('Error deleting cultural object:', error);
      return false;
    }
  }, [currentPage, loadPageObjects]);

  // Efectos iniciales
  useEffect(() => {
    if (!museumId) return;
    
    if (lastMuseumId.current === museumId && !isInitialLoad.current) {
      return;
    }
    
    lastMuseumId.current = museumId;
    isInitialLoad.current = false;
    
    loadMuseumData();
  }, [museumId, loadMuseumData]);

  // Actualizar filteredObjects cuando cambian los objetos
  useEffect(() => {
    if (!searchQuery) {
      setFilteredObjects(objects);
    }
  }, [objects, searchQuery]);

  return {
    museum,
    objects,
    loading,
    refreshing,
    currentPage,
    totalPages,
    totalElements,
    searchQuery,
    filteredObjects,
    isSearching,
    pageSize,
    loadMuseumData,
    loadPageObjects,
    refreshData,
    handleSearch,
    clearSearch,
    handlePageChange,
    handleDeleteMuseum,
    handleDeleteCulturalObject,
  };
}; 