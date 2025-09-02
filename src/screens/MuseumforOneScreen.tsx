import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

import { COLORS, getThemeColors } from '@constants/colors';
import { getRoleBasedOnToken } from '@utils/getRoleBasedOnToken';
import { useAuthContext } from '@contexts/AuthContext';

import CulturalObjectForm from '@components/CulturalObjectForm';
import SearchBar from '@components/common/SearchBar';
import Pagination from '@components/common/Pagination';
import Toast from '@components/common/Toast';
import { useToast } from '@hooks/useToast';
import { useMuseumData } from '@hooks/useMuseumData';
import { useMuseumUtils } from '@hooks/useMuseumUtils';
import { MuseumInfo, CulturalObjectsList } from '@components/museum';
import { CulturalObjectResponse } from '@interfaces/cuturalObject/CulturalObjectResponse';
import { useColorScheme } from 'react-native';

export default function MuseumforOneScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const museumId = route?.params?.museumId as number;
  const onMuseumDeleted = route?.params?.onMuseumDeleted;

  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');

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

  React.useEffect(() => {
    if (session) {
      const role = getRoleBasedOnToken(session);
      setUserRole(role);
    }
  }, [session]);

  const fromScreen = route?.params?.fromScreen as string | undefined;

  const handleBackPress = useCallback(() => {
    if (fromScreen === 'RedSocial') {
      navigation.navigate('RedSocial');
      return;
    }
    navigation.navigate('Museums');
  }, [navigation, fromScreen]);

  const onDeleteMuseum = useCallback(async () => {
    const success = await handleDeleteMuseum();
    if (success) {
      showSuccess('Museo eliminado correctamente');
      navigation.goBack();
    } else {
      showError('No se pudo eliminar el museo');
    }
  }, [handleDeleteMuseum, showSuccess, showError, navigation]);

  const handleCreateCulturalObject = useCallback(async () => {
    setShowForm(false);
    setEditingObject(null);
    await refreshData();
    showSuccess('Objeto cultural creado correctamente');
  }, [refreshData, showSuccess]);

  const handleEditCulturalObject = useCallback((object: CulturalObjectResponse) => {
    setEditingObject(object);
    setShowForm(true);
  }, []);

  const onDeleteCulturalObject = useCallback(async (objectId: number) => {
    const success = await handleDeleteCulturalObject(objectId);
    if (success) {
      showSuccess('Objeto cultural eliminado correctamente');
    } else {
      showError('No se pudo eliminar el objeto cultural');
    }
  }, [handleDeleteCulturalObject, showSuccess, showError]);

  const handleObjectPress = useCallback(
    (object: CulturalObjectResponse) => {
      navigation.push('ObjectDetail', {
        albumItem: convertToAlbumItem(object),
        culturalObject: object,
        fromScreen: 'Museo',
      });
    },
    [navigation, convertToAlbumItem]
  );
  if (!museumId) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No se encontró el museo.</Text>
        <TouchableOpacity style={[styles.fab, { backgroundColor: COLORS.primary }]} onPress={handleBackPress}>
          <Text style={styles.fabText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!museum) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No se encontró información del museo.</Text>
        <TouchableOpacity style={[styles.fab, { backgroundColor: COLORS.primary }]} onPress={handleBackPress}>
          <Text style={styles.fabText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: 'rgba(0,0,0,0.1)' }]}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleBackPress} style={styles.titleButton}>
          <Text style={[styles.headerTitle, { color: COLORS.black }]}>Detalles del Museo</Text>
        </TouchableOpacity>

        {userRole === 'COLLAB' && (
          <TouchableOpacity onPress={onDeleteMuseum} style={{ padding: 4 }}>
            <Ionicons name="trash-outline" size={22} color={COLORS.button?.danger ?? '#ef4444'} />
          </TouchableOpacity>
        )}
      </View>
        <View style={{ flex: 1 }}>
        <ScrollView
          style={[styles.container, { backgroundColor: COLORS.background }]}
          contentContainerStyle={{ paddingBottom: 80, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshData}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <MuseumInfo museum={museum} onMapPress={openInMaps} />

          <Text style={[styles.sectionTitle, { color: COLORS.primary }]}>Objetos culturales</Text>

          <SearchBar
            placeholder="Buscar objetos culturales..."
            onSearch={handleSearch}
            onClear={clearSearch}
            initialValue={searchQuery}
          />

          <CulturalObjectsList
            objects={filteredObjects}
            onObjectPress={handleObjectPress}
            onEditObject={handleEditCulturalObject}
            onDeleteObject={onDeleteCulturalObject}
            showActions={userRole === 'COLLAB'}
            isSearching={isSearching}
            searchQuery={searchQuery}
          />

          {!searchQuery && objects.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalElements={totalElements}
              pageSize={pageSize}
            />
          )}
        </ScrollView>

        {userRole === 'COLLAB' && (
          <TouchableOpacity style={[styles.fab, { backgroundColor: COLORS.primary }]} onPress={() => setShowForm(true)}>
            <Text style={styles.fabText}>➕</Text>
          </TouchableOpacity>
        )}

        <Modal
          visible={showForm}
          animationType="slide"
          transparent
          onRequestClose={() => {
            setShowForm(false);
            setEditingObject(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: COLORS.modal.background }]}>
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

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { marginRight: 16, padding: 4 },
  titleButton: { flex: 1, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', flex: 1 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 8 },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    elevation: 3,
    zIndex: 100,
  },
  fabText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.modal.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: { borderRadius: 12, padding: 20, width: '100%', maxWidth: 600, maxHeight: '85%' },
});