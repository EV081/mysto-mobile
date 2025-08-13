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
import { CulturalObjectType } from '@interfaces/cuturalObject/CulturalObjectType';
import { createCulturalObject } from '@services/culturalObject/createCulturalObject';
import { updateCulturalObject } from '@services/culturalObject/updateCulturalObject';
import { getCulturalObjectPictures } from '@services/pictures/getCulturalObjectPictures';
import { uploadCulturalObjectPictures } from '@services/pictures/uploadCulturalObjectPictures';
import { deletePicture } from '@services/pictures/deletePictures';

// Componentes modulares
import TypeSelector from '@components/CulturalObjectForm/TypeSelector';
import BasicInfoForm from '@components/CulturalObjectForm/BasicInfoForm';
import ImageUploader from '@components/common/ImageUploader';
import ImageGallery from '@components/common/ImageGallery';

interface CulturalObjectFormProps {
  museumId: number;
  culturalObjectId?: number; 
  onSuccess?: () => void;
  onCancel: () => void;
  loading?: boolean;
  editMode?: boolean;
  initialData?: {
    id: number;
    name: string;
    points: number;
    coins: number;
    description: string;
    type: CulturalObjectType;
  };
}

export default function CulturalObjectForm({
  culturalObjectId,
  museumId,
  onSuccess,
  onCancel,
  loading = false,
  editMode = false,
  initialData,
}: CulturalObjectFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [points, setPoints] = useState<number>(initialData?.points ?? 0);
  const [coins, setCoins] = useState<number>(initialData?.coins ?? 0);
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState<CulturalObjectType | null>(initialData?.type || null);
  const [newImages, setNewImages] = useState<any[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar imágenes existentes en modo edición
  useEffect(() => {
    if (editMode && culturalObjectId) {
      loadExistingImages();
    }
  }, [editMode, culturalObjectId]);

  const loadExistingImages = async () => {
    if (!culturalObjectId) return;
    setLoadingImages(true);
    try {
      const imageUrls = await getCulturalObjectPictures(culturalObjectId);
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

  const handleDeleteExistingImage = async (id: number) => {
    try {
      await deletePicture(id);
      setExistingImages(prev => prev.filter(img => img.id !== id));
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar la imagen. Intenta de nuevo.');
      console.error('Error eliminando imagen:', error);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim() || !type) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos obligatorios.');
      return;
    }

    if (isNaN(points) || isNaN(coins)) {
      Alert.alert('Error', 'Los puntos y monedas deben ser números válidos.');
      return;
    }

    setIsSubmitting(true);

    try {
      const culturalObjectData = {
        name: name.trim(),
        points,
        coins,
        description: description.trim(),
        type,
        pictures: [],
        images: newImages,
      };

      if (editMode && culturalObjectId) {
        await updateCulturalObject(culturalObjectId, culturalObjectData);

        // Subir nuevas imágenes
        if (newImages.length > 0) {
          for (const img of newImages) {
            await uploadCulturalObjectPictures(culturalObjectId, img.uri);
          }
        }

        Alert.alert('¡Éxito!', 'Objeto cultural actualizado correctamente.', [
          { text: 'OK', onPress: () => onSuccess?.() },
        ]);
      } else {
        const newObject = await createCulturalObject(culturalObjectData, museumId);

      // Subir imágenes
      if (newImages.length > 0) {
        for (const img of newImages) {
          if (img.uri) { // aseguramos que tenga uri
            await uploadCulturalObjectPictures(Number(newObject.id), img.uri);
          } else {
            console.warn('Imagen sin uri detectada:', img);
          }
        }
      }

        Alert.alert('¡Éxito!', 'Objeto cultural creado correctamente.', [
          {
            text: 'OK',
            onPress: () => {
              setName('');
              setPoints(0);
              setCoins(0);
              setDescription('');
              setType(null);
              setNewImages([]);
              onSuccess?.();
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error saving cultural object:', error);
      Alert.alert(
        'Error',
        `No se pudo ${editMode ? 'actualizar' : 'crear'} el objeto cultural. Verifica tu conexión e intenta de nuevo.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>🎨 {editMode ? 'Editar' : 'Nuevo'} Objeto Cultural</Text>

        <TypeSelector selectedType={type} onTypeChange={setType} />

        <BasicInfoForm
          name={name}
          points={points}
          coins={coins}
          description={description}
          onNameChange={setName}
          onPointsChange={(val) => setPoints(Number(val))}
          onCoinsChange={(val) => setCoins(Number(val))}
          onDescriptionChange={setDescription}
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
          title={editMode ? 'Agregar nuevas imágenes' : 'Imágenes'}
          buttonText={editMode ? 'Agregar más imágenes' : 'Agregar imágenes'}
        />

        <View style={styles.actions}>
          <Button
            onPress={onCancel}
            style={styles.cancelButton}
            mode="outlined"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={
              isSubmitting || !name.trim() || !description.trim() || !type
            }
            buttonColor={COLORS.primary}
            style={styles.submitButton}
          >
            {editMode ? 'Actualizar' : 'Crear'} Objeto
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    zIndex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
    borderRadius: 12,
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
  },
});
