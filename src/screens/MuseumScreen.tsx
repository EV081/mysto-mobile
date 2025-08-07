import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, ScrollView, Alert, Modal, Text } from 'react-native';
import { useAuthState } from '../hooks/useAuth';
import { getPagedMuseums } from '@services/museum/getListarMuseums';
import { createMuseum } from '@services/museum/createMuseum';
import { putUpdateMuseum } from '@services/museum/putupdateMuseum';
import { uploadMuseumPictures } from '@services/pictures/uploadMuseumPictures';
import { useNavigation } from '@react-navigation/native';
import { Button, IconButton } from 'react-native-paper';
import { COLORS } from '@constants/colors';
import MuseumForm from '@components/MuseumForm';
import MuseumCard from '@components/MuseumCard';
import { MuseumResponse } from '@interfaces/museum/MuseumResponse';

export default function MuseumScreen() {
  const { session } = useAuthState();
  const { role } = useAuthState();
  const navigation = useNavigation();
  const [museums, setMuseums] = useState<MuseumResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingMuseum, setEditingMuseum] = useState<MuseumResponse | null>(null);

  useEffect(() => {
    fetchMuseums();
  }, []);

  const fetchMuseums = async () => {
    setLoading(true);
    try {
      const data = await getPagedMuseums();
      setMuseums(data.contents); // Usa el array correcto según tu backend
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar los museos');
    }
    setLoading(false);
  };

  const handleSubmitMuseum = async (data: any) => {
    setFormLoading(true);
    try {
      const { images, ...museumData } = data;
      
      if (editMode && editingMuseum) {
        // Modo edición
        await putUpdateMuseum(editingMuseum.id, museumData);
        if (images && images.length > 0) {
          for (const img of images) {
            if (!img.id) { // Solo subir imágenes nuevas
              await uploadMuseumPictures(editingMuseum.id, img.uri);
            }
          }
        }
        Alert.alert('Éxito', 'Museo actualizado correctamente');
      } else {
        // Modo creación
        const museum = await createMuseum(museumData);
        if (images && images.length > 0) {
          for (const img of images) {
            await uploadMuseumPictures(museum.id, img.uri);
          }
        }
        Alert.alert('Éxito', 'Museo creado correctamente');
      }
      
      setShowForm(false);
      setEditMode(false);
      setEditingMuseum(null);
      fetchMuseums();
    } catch (e) {
      console.error('Error en operación de museo:', e);
      Alert.alert(
        'Error', 
        editMode ? 'No se pudo actualizar el museo. Verifica tu conexión e intenta de nuevo.' : 'No se pudo crear el museo. Verifica tu conexión e intenta de nuevo.'
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditMuseum = (museum: MuseumResponse) => {
    setEditingMuseum(museum);
    setEditMode(true);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditMode(false);
    setEditingMuseum(null);
  };

  const handleMuseumPress = (museum: MuseumResponse) => {
    (navigation as any).navigate('MuseumforOneScreen', { 
      museumId: museum.id,
      onMuseumDeleted: fetchMuseums
    });
  };

  return (
    <View style={styles.container}>
      {role === 'COLLAB' && (
        <Button
          mode="contained"
          style={styles.createButton}
          onPress={() => setShowForm(true)}
          icon="plus"
          buttonColor={COLORS.primary}
        >
          Crear museo
        </Button>
      )}

      {loading ? (
        <ActivityIndicator color={COLORS.primary} size="large" />
      ) : (
        <FlatList
          data={museums}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <MuseumCard
              museum={item}
              onPress={() => handleMuseumPress(item)}
              onEdit={role === 'COLLAB' ? () => handleEditMuseum(item) : undefined}
              disabled={false}
            />
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
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
                latitud: editingMuseum.latitud,
                longitud: editingMuseum.longitud,
                openTime: editingMuseum.openTime,
                closeTime: editingMuseum.closeTime,
                images: []
              } : undefined}
              museumId={editingMuseum?.id}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  createButton: {
    marginBottom: 16,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});