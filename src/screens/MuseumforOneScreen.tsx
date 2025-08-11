import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Linking,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl
} from 'react-native';
import { SafeAreaView, Platform, StatusBar } from 'react-native';
import { COLORS } from '@constants/colors';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getMuseumForId } from '@services/museum/getMuseumforId';
import { getPagedMuseums } from '@services/culturalObject/getListarCulturalObject';
import { getObjectsByMuseumId } from '@services/museum/getListarObjetsforMuseum';
import { deleteMuseum } from '@services/museum/delteMuseum';
import { deleteCulturalObject } from '@services/culturalObject/deleteCulturalObject';
import { getRoleBasedOnToken } from '@utils/getRoleBasedOnToken';
import { useAuthContext } from '@contexts/AuthContext';
import MuseumImagesCarousel from '@components/MuseumForm/MuseumImagesCarousel';
import CulturalObjectForm from '@components/CulturalObjectForm';
import SearchBar from '@components/common/SearchBar';
import Pagination from '@components/common/Pagination';
import Toast from '@components/common/Toast';
import { useToast } from '@hooks/useToast';
import { useSearch } from '@hooks/useSearch';
import { PagedResponse } from '@interfaces/common/PagedResponse';
import { CulturalObjectResponse } from '@interfaces/cuturalObject/CulturalObjectResponse';
import { MuseumResponse } from '@interfaces/museum/MuseumResponse';

export default function MuseumforOneScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const museumId = route?.params?.museumId as number;
  const onMuseumDeleted = route?.params?.onMuseumDeleted;
  const { session } = useAuthContext();

  // Estados principales
  const [museum, setMuseum] = useState<MuseumResponse | null>(null);
  const [objects, setObjects] = useState<CulturalObjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingObject, setEditingObject] = useState<CulturalObjectResponse | null>(null);

  // Estados de paginación simplificados
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 6;



  // Refs para evitar dependencias circulares
  const isInitialLoad = useRef(true);
  const lastMuseumId = useRef<number | null>(null);

  // Hooks personalizados
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();
  
  // Estados para búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredObjects, setFilteredObjects] = useState<CulturalObjectResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);



  // Función para manejar búsqueda
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      // Si hay búsqueda, cargar todos los objetos y filtrar
      setIsSearching(true);
      try {
        const allObjectsData = await getObjectsByMuseumId(museumId);
        const filtered = allObjectsData.filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredObjects(filtered);
      } catch (e) {
        showError('No se pudieron cargar todos los objetos para la búsqueda');
        setFilteredObjects([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      // Si no hay búsqueda, usar los objetos de la página actual
      setFilteredObjects(objects);
    }
  }, [museumId, objects, showError]);

  // Función para limpiar búsqueda
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilteredObjects(objects);
  }, [objects]);





  // Efectos iniciales
  useEffect(() => {
    if (!museumId) return;
    
    // Evitar cargar múltiples veces el mismo museo
    if (lastMuseumId.current === museumId && !isInitialLoad.current) {
      return;
    }
    
    lastMuseumId.current = museumId;
    isInitialLoad.current = false;
    
    // Cargar museo directamente aquí para evitar dependencias circulares
    const loadMuseumData = async () => {
      setLoading(true);
      try {
        const response = await getMuseumForId(museumId);
        setMuseum(response.data);
        
        // Cargar objetos culturales
        const data: PagedResponse<CulturalObjectResponse> = await getPagedMuseums(museumId, 0, pageSize);
        setObjects(data.contents);
        setCurrentPage(data.paginaActual);
        setTotalPages(data.totalPaginas);
        setTotalElements(data.totalElementos);
      } catch (e) {
        showError('No se pudo cargar el museo');
      }
      setLoading(false);
    };
    
    loadMuseumData();
  }, [museumId, showError]);

  useEffect(() => {
    if (session) {
      const role = getRoleBasedOnToken(session);
      setUserRole(role);
    }
  }, [session]);

  // Efecto para actualizar filteredObjects cuando cambian los objetos
  useEffect(() => {
    if (!searchQuery) {
      setFilteredObjects(objects);
    }
  }, [objects, searchQuery]);

  // Función para refrescar datos
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [museumResponse, objectsResponse] = await Promise.all([
        getMuseumForId(museumId),
        getPagedMuseums(museumId, currentPage, pageSize)
      ]);
      setMuseum(museumResponse.data);
      setObjects(objectsResponse.contents);
      setCurrentPage(objectsResponse.paginaActual);
      setTotalPages(objectsResponse.totalPaginas);
      setTotalElements(objectsResponse.totalElementos);
    } catch (e) {
      showError('No se pudo recargar los datos');
    }
    setRefreshing(false);
  }, [museumId, currentPage, showError]);

  // Función para formatear hora
  const formatHour = useCallback((time?: string) => {
    if (!time) return '';
    return time.substring(0, 5);
  }, []);

  // Función para abrir en mapas
  const openInMaps = useCallback((lat: number | string, lon: number | string) => {
    const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
    const lonNum = typeof lon === 'string' ? parseFloat(lon) : lon;
    
    if (isNaN(latNum) || isNaN(lonNum)) {
      showWarning('Coordenadas inválidas');
      return;
    }
    
    const url = Platform.OS === 'ios' 
      ? `http://maps.apple.com/?daddr=${latNum},${lonNum}`
      : `geo:${latNum},${lonNum}?q=${latNum},${lonNum}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        showWarning('No se pudo abrir el mapa');
      }
    });
  }, [showWarning]);

  // Función para eliminar museo
  const handleDeleteMuseum = useCallback(async () => {
    try {
      await deleteMuseum(museumId);
      showSuccess('Museo eliminado correctamente');
      if (onMuseumDeleted) {
        onMuseumDeleted();
      }
      navigation.goBack();
    } catch (error) {
      showError('No se pudo eliminar el museo');
    }
  }, [museumId, onMuseumDeleted, navigation, showSuccess, showError]);

  // Función para crear objeto cultural
  const handleCreateCulturalObject = useCallback(async () => {
    setShowForm(false);
    setEditingObject(null);
    // Recargar datos después de crear
    try {
      const data: PagedResponse<CulturalObjectResponse> = await getPagedMuseums(museumId, currentPage, pageSize);
      setObjects(data.contents);
      setCurrentPage(data.paginaActual);
      setTotalPages(data.totalPaginas);
      setTotalElements(data.totalElementos);
    } catch (e) {
      showError('No se pudieron recargar los objetos culturales');
    }
    showSuccess('Objeto cultural creado correctamente');
  }, [museumId, currentPage, showSuccess, showError]);

  // Función para editar objeto cultural
  const handleEditCulturalObject = useCallback((object: any) => {
    setEditingObject(object);
    setShowForm(true);
  }, []);

  // Función para eliminar objeto cultural
  const handleDeleteCulturalObject = useCallback(async (objectId: number) => {
    try {
      await deleteCulturalObject(objectId);
      // Recargar datos después de eliminar
      try {
        const data: PagedResponse<CulturalObjectResponse> = await getPagedMuseums(museumId, currentPage, pageSize);
        setObjects(data.contents);
        setCurrentPage(data.paginaActual);
        setTotalPages(data.totalPaginas);
        setTotalElements(data.totalElementos);
      } catch (e) {
        showError('No se pudieron recargar los objetos culturales');
      }
      showSuccess('Objeto cultural eliminado correctamente');
    } catch (error) {
      showError('No se pudo eliminar el objeto cultural');
    }
  }, [museumId, currentPage, showSuccess, showError]);

  // Función para cambiar de página
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Cargar objetos de la nueva página
    const loadPageObjects = async () => {
      try {
        const data: PagedResponse<CulturalObjectResponse> = await getPagedMuseums(museumId, page, pageSize);
        setObjects(data.contents);
        setCurrentPage(data.paginaActual);
        setTotalPages(data.totalPaginas);
        setTotalElements(data.totalElementos);
      } catch (e) {
        showError('No se pudieron cargar los objetos culturales');
      }
    };
    loadPageObjects();
  }, [museumId, showError]);

  // Validaciones iniciales
  if (!museumId) {
    return (
      <View style={styles.centered}>
        <Text>No se encontró el museo.</Text>
        <TouchableOpacity style={styles.fab} onPress={() => navigation.goBack()}>
          <Text style={styles.fabText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!museum) {
    return (
      <View style={styles.centered}>
        <Text>No se encontró información del museo.</Text>
        <TouchableOpacity style={styles.fab} onPress={() => navigation.goBack()}>
          <Text style={styles.fabText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 80, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshData}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle} numberOfLines={1}>{"Detalles del Museo"}</Text>
              {userRole === 'COLLAB' && (
                <TouchableOpacity onPress={handleDeleteMuseum} style={styles.deleteButton}>
                  <Text style={styles.deleteIcon}>✖️</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.headerLine} />

            {/* Información del museo */}
            <View style={{ height: 0 }} />
            {museum.pictureUrls && museum.pictureUrls.length > 0 && (
              <MuseumImagesCarousel images={museum.pictureUrls} />
            )}
            <Text style={[styles.title, { marginTop: 10 }]}>{museum.name}</Text>
            <Text style={styles.desc}>{museum.description}</Text>
            
            <TouchableOpacity onPress={() => openInMaps(museum.latitude as number, museum.longitude as number)}>
              <Text style={[styles.info, { color: COLORS.blue[600], textDecorationLine: 'underline' }]}>
                Ver en el mapa
              </Text>
            </TouchableOpacity>

            {museum.openTime && museum.closeTime && (
              <Text style={styles.info}>
                Abre: {formatHour(museum.openTime)} - Cierra: {formatHour(museum.closeTime)}
              </Text>
            )}

            {/* Sección de objetos culturales */}
            <Text style={styles.sectionTitle}>Objetos culturales</Text>
            
            {/* Barra de búsqueda */}
            <SearchBar
              placeholder="Buscar objetos culturales..."
              onSearch={handleSearch}
              onClear={clearSearch}
              initialValue={searchQuery}
            />

            {/* Indicador de carga para búsqueda */}
            {isSearching && (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator color={COLORS.primary} size="small" />
                <Text style={styles.searchLoadingText}>Buscando...</Text>
              </View>
            )}

            {filteredObjects.length === 0 ? (
              <Text style={styles.info}>
                {searchQuery ? 'No se encontraron objetos que coincidan con la búsqueda.' : 'No hay objetos culturales asociados.'}
              </Text>
            ) : (
              <FlatList
                data={filteredObjects}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.objectCard}>
                    {item.pictureUrls && item.pictureUrls.length > 0 && (
                      <Image source={{ uri: item.pictureUrls[0] }} style={styles.objectImage} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.objectTitle} numberOfLines={3}>{item.name}</Text>
                      <Text style={styles.objectDesc} numberOfLines={3}>{item.description}</Text>
                      {userRole === 'COLLAB' && (
                        <View style={styles.objectActions}>
                          <TouchableOpacity 
                            onPress={() => handleEditCulturalObject(item)}
                            style={styles.editObjectButton}
                          >
                            <Text style={styles.editObjectText}>Editar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => handleDeleteCulturalObject(item.id)}
                            style={styles.deleteObjectButton}
                          >
                            <Text style={styles.deleteObjectText}>Eliminar</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                )}
                scrollEnabled={false}
                nestedScrollEnabled={true}
              />
            )}

            {/* Paginación */}
            {!searchQuery && objects.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalElements={totalElements}
                pageSize={pageSize}
              />
            )}
          </View>
        </ScrollView>
        
        {/* Botón flotante para agregar objetos culturales */}
        {userRole === 'COLLAB' && (
          <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
            <Text style={styles.fabText}>➕</Text>
          </TouchableOpacity>
        )}

        {/* Modal del formulario */}
        <Modal
          visible={showForm}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowForm(false);
            setEditingObject(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <CulturalObjectForm
                culturalObjectId={editingObject?.id}
                museumId={museumId}
                onSuccess={handleCreateCulturalObject}
                onCancel={() => {
                  setShowForm(false);
                  setEditingObject(null);
                }}
                loading={formLoading}
                editMode={!!editingObject}
                initialData={editingObject || undefined}
              />
            </View>
          </View>
        </Modal>
      </View>

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8
  },
  desc: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8
  },
  info: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
    color: COLORS.primary
  },
  objectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.card.border
  },
  objectImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: COLORS.background
  },
  objectTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: COLORS.primary
  },
  objectDesc: {
    color: COLORS.text,
    fontSize: 13
  },
  objectActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  editObjectButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: COLORS.button.primary,
    borderRadius: 4,
  },
  editObjectText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold'
  },
  deleteObjectButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: COLORS.button.danger,
    borderRadius: 4,
  },
  deleteObjectText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold'
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    elevation: 3,
    zIndex: 100,
  },
  fabText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',         
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,         
    backgroundColor: COLORS.white,
  },
  headerLine: {
    height: 2,
    backgroundColor: COLORS.gray[200],
    width: '100%',
    shadowColor: COLORS.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  backArrow: {
    fontSize: 28,
    color: COLORS.primary,
    marginRight: 12,
    lineHeight: 28, 
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    flexShrink: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: 0,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  deleteIcon: {
    fontSize: 20,
    color: COLORS.button.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.modal.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.modal.background,
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
    maxHeight: '80%',
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  searchLoadingText: {
    fontSize: 14,
    color: COLORS.text,
  },
});
