import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Modal, RefreshControl } from 'react-native';
import { SafeAreaView, Platform, StatusBar } from 'react-native';
import { COLORS } from '@constants/colors';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getRoleBasedOnToken } from '@utils/getRoleBasedOnToken';
import { useAuthContext } from '@contexts/AuthContext';
import CulturalObjectForm from '@components/CulturalObjectForm';
import SearchBar from '@components/common/SearchBar';
import Pagination from '@components/common/Pagination';
import Toast from '@components/common/Toast';
import { useToast } from '@hooks/useToast';
import { useMuseumData } from '@hooks/useMuseumData';
import { useMuseumUtils } from '@hooks/useMuseumUtils';
import { MuseumHeader, MuseumInfo, CulturalObjectsList } from '@components/museum';
import { CulturalObjectResponse } from '@interfaces/cuturalObject/CulturalObjectResponse';

export default function MuseumforOneScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const museumId = route?.params?.museumId as number;
  const onMuseumDeleted = route?.params?.onMuseumDeleted;
  const { session } = useAuthContext();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingObject, setEditingObject] = useState<CulturalObjectResponse | null>(null);
  
  const { toast, showSuccess, showError, hideToast } = useToast();
  const { openInMaps, convertToAlbumItem } = useMuseumUtils();
  
  const {
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
    refreshData,
    handleSearch,
    clearSearch,
    handlePageChange,
    handleDeleteMuseum,
    handleDeleteCulturalObject,
  } = useMuseumData(museumId, onMuseumDeleted);

  // Efecto para obtener el rol del usuario
  React.useEffect(() => {
    if (session) {
      const role = getRoleBasedOnToken(session);
      setUserRole(role);
    }
  }, [session]);

  // Función para eliminar museo
  const onDeleteMuseum = useCallback(async () => {
    const success = await handleDeleteMuseum();
    if (success) {
      showSuccess('Museo eliminado correctamente');
      navigation.goBack();
    } else {
      showError('No se pudo eliminar el museo');
    }
  }, [handleDeleteMuseum, showSuccess, showError, navigation]);

  // Función para crear objeto cultural
  const handleCreateCulturalObject = useCallback(async () => {
    setShowForm(false);
    setEditingObject(null);
    await refreshData();
    showSuccess('Objeto cultural creado correctamente');
  }, [refreshData, showSuccess]);

  // Función para editar objeto cultural
  const handleEditCulturalObject = useCallback((object: CulturalObjectResponse) => {
    setEditingObject(object);
    setShowForm(true);
  }, []);

  // Función para eliminar objeto cultural
  const onDeleteCulturalObject = useCallback(async (objectId: number) => {
    const success = await handleDeleteCulturalObject(objectId);
    if (success) {
      showSuccess('Objeto cultural eliminado correctamente');
    } else {
      showError('No se pudo eliminar el objeto cultural');
    }
  }, [handleDeleteCulturalObject, showSuccess, showError]);

  // Función para navegar al detalle del objeto
  const handleObjectPress = useCallback((object: CulturalObjectResponse) => {
    navigation.push('ObjectDetail', { 
      albumItem: convertToAlbumItem(object),
      culturalObject: object,
      fromScreen: 'Museo'
    });
  }, [navigation, convertToAlbumItem]);

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
            <MuseumHeader
              onBack={() => navigation.goBack()}
              onDelete={onDeleteMuseum}
              showDeleteButton={userRole === 'COLLAB'}
            />

            {/* Información del museo */}
            <View style={{ height: 0 }} />
            <MuseumInfo museum={museum} onMapPress={openInMaps} />

            {/* Sección de objetos culturales */}
            <Text style={styles.sectionTitle}>Objetos culturales</Text>
            
            {/* Barra de búsqueda */}
            <SearchBar
              placeholder="Buscar objetos culturales..."
              onSearch={handleSearch}
              onClear={clearSearch}
              initialValue={searchQuery}
            />

            {/* Lista de objetos culturales */}
            <CulturalObjectsList
              objects={filteredObjects}
              onObjectPress={handleObjectPress}
              onEditObject={handleEditCulturalObject}
              onDeleteObject={onDeleteCulturalObject}
              showActions={userRole === 'COLLAB'}
              isSearching={isSearching}
              searchQuery={searchQuery}
            />

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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
    color: COLORS.primary
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
});
