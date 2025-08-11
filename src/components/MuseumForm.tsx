import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Button } from 'react-native-paper';
import { COLORS } from '@constants/colors';
import { MuseumRequest } from '@interfaces/museum/MuseumRequest';
import { getMuseumPictures } from '@services/pictures/getMuseumPictures';
import { deletePicture } from '@services/pictures/deletePictures';

// Componentes modulares
import GeneralInfoForm from '@components/MuseumForm/GeneralInfoForm';
import TimeSelector from '@components/MuseumForm/TimeSelector';
import ImageUploader from '@components/common/ImageUploader';
import ImageGallery from '@components/common/ImageGallery';

interface MuseumFormProps {
  onSubmit: (data: MuseumRequest & { images?: any[] }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  editMode?: boolean;
  initialData?: {
    name: string;
    description: string;
    latitud: number;
    longitud: number;
    openTime: string;
    closeTime: string;
    images?: any[];
  };
  museumId?: number; // Para cargar imágenes existentes en modo edición
}

export default function MuseumForm({ 
  onSubmit, 
  onCancel, 
  loading = false, 
  editMode = false, 
  initialData,
  museumId 
}: MuseumFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [latitud, setLatitud] = useState(initialData?.latitud?.toString() || '');
  const [longitud, setLongitud] = useState(initialData?.longitud?.toString() || '');
  const [openTime, setOpenTime] = useState(initialData?.openTime || '');
  const [closeTime, setCloseTime] = useState(initialData?.closeTime || '');
  const [newImages, setNewImages] = useState<any[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Cargar imágenes existentes en modo edición
  useEffect(() => {
    if (editMode && museumId) {
      loadExistingImages();
    }
  }, [editMode, museumId]);

const loadExistingImages = async () => {
  if (!museumId) return;
  
  setLoadingImages(true);
  try {
    const imageUrls = await getMuseumPictures(museumId);
    // Aquí asumimos que getMuseumPictures devuelve array de objetos {id: number, url: string}
    const imagesWithIds = imageUrls.map((img: { id: number; url: string }) => ({
      id: img.id,
      url: img.url,
    }));
    setExistingImages(imagesWithIds);
  } catch (error) {
    console.error('Error loading existing images:', error);
  } finally {
    setLoadingImages(false);
  }
};

  const handleSubmit = async () => {
    if (
      !name.trim() ||
      !description.trim() ||
      !latitud.trim() ||
      !longitud.trim() ||
      !openTime.trim() ||
      !closeTime.trim()
    ) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos obligatorios.');
      return;
    }

    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);
    
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Error', 'Las coordenadas deben ser números válidos.');
      return;
    }

    if (lat < -90 || lat > 90) {
      Alert.alert('Error', 'La latitud debe estar entre -90 y 90.');
      return;
    }

    if (lng < -180 || lng > 180) {
      Alert.alert('Error', 'La longitud debe estar entre -180 y 180.');
      return;
    }

    try {
      const data: MuseumRequest & { images?: any[] } = {
        name: name.trim(),
        description: description.trim(),
        latitude: lat,
        longitude: lng,
        openTime,
        closeTime,
        pictures: [],
        images: newImages,
      };
      
      await onSubmit(data);

      if (!editMode) {
        setName('');
        setDescription('');
        setLatitud('');
        setLongitud('');
        setOpenTime('');
        setCloseTime('');
        setNewImages([]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar el formulario. Verifica tu conexión e intenta de nuevo.');
    }
  };

  const handleDeleteExistingImage = async (id: number) => {
    try {
      await deletePicture(id);
      setExistingImages(prev => prev.filter(img => img.id !== id));
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la imagen. Intenta de nuevo.');
      console.error('Error eliminando imagen:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {editMode ? '✏️ Editar Centro Cultural' : '🏛️ Nuevo Centro Cultural'}
        </Text>

        <GeneralInfoForm
          name={name}
          description={description}
          latitud={latitud}
          longitud={longitud}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onLatitudChange={setLatitud}
          onLongitudChange={setLongitud}
        />

        <TimeSelector
          openTime={openTime}
          closeTime={closeTime}
          onOpenTimeChange={setOpenTime}
          onCloseTimeChange={setCloseTime}
        />

        {editMode && (
          <ImageGallery
            images={existingImages}
            onImagesChange={setExistingImages}
            onDeleteImage={handleDeleteExistingImage}
            title="Imágenes actuales"
            loading={loadingImages}
          />
        )}

        <ImageUploader
          images={newImages}
          onImagesChange={setNewImages}
          title={editMode ? "Agregar nuevas imágenes" : "Imágenes"}
          buttonText={editMode ? "Agregar más imágenes" : "Agregar imágenes"}
        />

        <View style={styles.actions}>
          <Button
            onPress={onCancel}
            style={styles.cancelButton}
            mode="outlined"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={
              loading ||
              !name.trim() ||
              !description.trim() ||
              !latitud.trim() ||
              !longitud.trim() ||
              !openTime ||
              !closeTime
            }
            buttonColor={COLORS.primary}
            style={styles.submitButton}
          >
            {editMode ? 'Actualizar Museo' : 'Crear Museo'}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    zIndex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#ffffff',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: COLORS.primary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 50,
  },
  submitButton: {
    flex: 1,
    borderRadius: 16,
    minHeight: 50,
  },
});
