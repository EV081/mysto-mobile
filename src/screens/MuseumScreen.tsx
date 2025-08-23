import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { useAuthState } from '../hooks/useAuth';
import { getPagedMuseums } from '@services/museum/getListarMuseums';
import { createMuseum } from '@services/museum/createMuseum';
import { putUpdateMuseum } from '@services/museum/putupdateMuseum';
import { uploadMuseumPictures } from '@services/pictures/uploadMuseumPictures';
import { useNavigation } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import { COLORS } from '@constants/colors';
import MuseumForm from '@components/MuseumForm';
import MuseumCard from '@components/MuseumCard';
import SearchBar from '@components/common/SearchBar';
import Pagination from '@components/common/Pagination';
import Toast from '@components/common/Toast';
import { useToast } from '@hooks/useToast';
import { useSearch } from '@hooks/useSearch';
import { MuseumResponse } from '@interfaces/museum/MuseumResponse';
import { PagedResponse } from '@interfaces/common/PagedResponse';

export default function MuseumScreen() {
  const { role } = useAuthState();
  const navigation = useNavigation();
  const [museums, setMuseums] = useState<MuseumResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingMuseum, setEditingMuseum] = useState<MuseumResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 6;
  const isInitialLoad = useRef(true);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const { filteredData: filteredMuseums, handleSearch, clearSearch, searchQuery } = useSearch(
    museums,
    ['name', 'description']
  );

  const loadMuseums = useCallback(async (page: number = 0) => {
    setLoading(true);
    try {
      const data: PagedResponse<MuseumResponse> = await getPagedMuseums(page, pageSize);
      setMuseums(data.contents);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (e) {
      showError('No se pudieron cargar los museos');
    }
    setLoading(false);
  }, [showError]);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      loadMuseums(0);
    }
  }, [loadMuseums]);

  const handleSubmitMuseum = async (data: any) => {
    setFormLoading(true);
    try {
      const { images, ...museumData } = data;
      
      if (editMode && editingMuseum) {
        await putUpdateMuseum(editingMuseum.id, museumData);
        if (images?.length > 0) {
          for (const img of images) {
            if (!img.id) {
              await uploadMuseumPictures(editingMuseum.id, img.uri);
            }
          }
        }
        showSuccess('Museo actualizado correctamente');
      } else {
        const museum = await createMuseum(museumData);
        if (images?.length > 0) {
          for (const img of images) {
            await uploadMuseumPictures(museum.id, img.uri);
          }
        }
        showSuccess('Museo creado correctamente');
      }
      
      setShowForm(false);
      setEditMode(false);
      setEditingMuseum(null);
      await loadMuseums(currentPage);
    } catch (e) {
      const message = editMode ? 'No se pudo actualizar el museo' : 'No se pudo crear el museo';
      showError(message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditMuseum = useCallback((museum: MuseumResponse) => {
    setEditingMuseum(museum);
    setEditMode(true);
    setShowForm(true);
  }, []);

  const handleCancelForm = useCallback(() => {
    setShowForm(false);
    setEditMode(false);
    setEditingMuseum(null);
  }, []);

  const handleMuseumPress = useCallback((museum: MuseumResponse) => {
    (navigation as any).navigate('MuseumforOneScreen', { 
      museumId: museum.id,
      onMuseumDeleted: () => loadMuseums(currentPage)
    });
  }, [navigation, loadMuseums, currentPage]);

  const handleShowCreateForm = useCallback(() => {
    setShowForm(true);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    loadMuseums(page);
  }, [loadMuseums]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {role === 'COLLAB' && (
        <Button
          mode="contained"
          style={styles.createButton}
          onPress={handleShowCreateForm}
          icon="plus"
          buttonColor={COLORS.primary}
        >
          Crear museo
        </Button>
      )}

      <SearchBar
        placeholder="Buscar museos por nombre..."
        onSearch={handleSearch}
        onClear={clearSearch}
        initialValue={searchQuery}
      />

      <FlatList
        data={filteredMuseums}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <MuseumCard
            museum={item}
            onPress={() => handleMuseumPress(item)}
            onEdit={role === 'COLLAB' ? () => handleEditMuseum(item) : undefined}
            disabled={false}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {!searchQuery && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalElements={totalElements}
          pageSize={pageSize}
        />
      )}

      <Modal visible={showForm} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MuseumForm
              onSubmit={handleSubmitMuseum}
              onCancel={handleCancelForm}
              loading={formLoading}
              editMode={editMode}
              initialData={editingMuseum ? {
                name: editingMuseum.name,
                description: editingMuseum.description,
                latitud: editingMuseum.latitude,
                longitud: editingMuseum.longitude,
                openTime: editingMuseum.openTime,
                closeTime: editingMuseum.closeTime,
                images: []
              } : undefined}
              museumId={editingMuseum?.id}
            />
          </View>
        </View>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  createButton: {
    marginBottom: 16,
    borderRadius: 8,
  },
  listContainer: {
    paddingBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.modal.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.modal.background,
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    height: '80%',
    shadowColor: COLORS.card.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});