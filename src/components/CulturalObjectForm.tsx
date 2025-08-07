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
import { getReviewPictures as getCulturalObjectPictures } from '@services/pictures/getCulturalObjectPictures';
import { uploadCulturalObjectPictures } from '@services/pictures/uploadCulturalObjectPictures';

// Componentes modulares
import TypeSelector from '@components/CulturalObjectForm/TypeSelector';
import BasicInfoForm from '@components/CulturalObjectForm/BasicInfoForm';
import ImageUploader from '@components/common/ImageUploader';
import ImageGallery from '@components/common/ImageGallery';

interface CulturalObjectFormProps {
  museumId: number;
  onSuccess?: () => void;
  onCancel: () => void;
  loading?: boolean;
  editMode?: boolean;
  culturalObject?: any; // Para edición
}

export default function CulturalObjectForm({
  museumId,
  onSuccess,
  onCancel,
  loading = false,
  editMode = false,
  culturalObject,
}: CulturalObjectFormProps) {
  const [name, setName] = useState(editMode && culturalObject ? culturalObject.name : '');
  const [points, setPoints] = useState(editMode && culturalObject ? culturalObject.points?.toString() || '' : '');
  const [coins, setCoins] = useState(editMode && culturalObject ? culturalObject.coins?.toString() || '' : '');
  const [description, setDescription] = useState(editMode && culturalObject ? culturalObject.description : '');
  const [type, setType] = useState<CulturalObjectType | null>(editMode && culturalObject ? culturalObject.type : null);
  const [newImages, setNewImages] = useState<any[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar imágenes existentes en modo edición
  useEffect(() => {
    if (editMode && culturalObject?.id) {
      loadExistingImages();
    }
  }, [editMode, culturalObject?.id]);

  const loadExistingImages = async () => {
    if (!culturalObject?.id) return;
    
    setLoadingImages(true);
    try {
      const imageUrls = await getCulturalObjectPictures(culturalObject.id.toString());
      const imagesWithIds = imageUrls.map((url, index) => ({
        id: `existing-${index}`,
        url: url
      }));
      setExistingImages(imagesWithIds);
    } catch (error) {
      console.error('Error loading existing images:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !points.trim() || !coins.trim() || !description.trim() || !type) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos obligatorios.');
      return;
    }

    const pointsNum = parseInt(points.trim());
    const coinsNum = parseInt(coins.trim());

    if (isNaN(pointsNum) || isNaN(coinsNum)) {
      Alert.alert('Error', 'Los puntos y monedas deben ser números válidos.');
      return;
    }

    setIsSubmitting(true);

    try {
      const culturalObjectData = {
        name: name.trim(),
        points: pointsNum,
        coins: coinsNum,
        description: description.trim(),
        type: type,
        pictures: [],
      };

      if (editMode && culturalObject) {
        await updateCulturalObject(culturalObject.id, culturalObjectData);
        
        // Subir nuevas imágenes si las hay
        if (newImages.length > 0) {
          for (const img of newImages) {
            await uploadCulturalObjectPictures(culturalObject.id, img.uri);
          }
        }
        
        Alert.alert(
          '¡Éxito!', 
          'Objeto cultural actualizado correctamente.',
          [{ text: 'OK', onPress: () => {
            onSuccess?.();
          }}]
        );
      } else {
        const newObject = await createCulturalObject(culturalObjectData, museumId);
        
        // Subir imágenes si las hay
        if (newImages.length > 0) {
          for (const img of newImages) {
            await uploadCulturalObjectPictures(newObject.id, img.uri);
          }
        }
        
        Alert.alert(
          '¡Éxito!', 
          'Objeto cultural creado correctamente.',
          [{ text: 'OK', onPress: () => {
            setName('');
            setPoints('');
            setCoins('');
            setDescription('');
            setType(null);
            setNewImages([]);
            onSuccess?.();
          }}]
        );
      }

    } catch (error) {
      console.error('Error saving cultural object:', error);
      Alert.alert('Error', `No se pudo ${editMode ? 'actualizar' : 'crear'} el objeto cultural. Verifica tu conexión e intenta de nuevo.`);
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

        {/* Selector de tipo */}
        <TypeSelector
          selectedType={type}
          onTypeChange={setType}
        />

        {/* Información básica */}
        <BasicInfoForm
          name={name}
          points={points}
          coins={coins}
          description={description}
          onNameChange={setName}
          onPointsChange={setPoints}
          onCoinsChange={setCoins}
          onDescriptionChange={setDescription}
        />

        {/* Imágenes existentes (solo en modo edición) */}
        {editMode && (
          <ImageGallery
            images={existingImages}
            onImagesChange={setExistingImages}
            title="Imágenes actuales"
            loading={loadingImages}
          />
        )}

        {/* Subida de nuevas imágenes */}
        <ImageUploader
          images={newImages}
          onImagesChange={setNewImages}
          title={editMode ? "Agregar nuevas imágenes" : "Imágenes"}
          buttonText={editMode ? "Agregar más imágenes" : "Agregar imágenes"}
        />

        {/* Botones de acción */}
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
            disabled={isSubmitting || !name.trim() || !points.trim() || !coins.trim() || !description.trim() || !type}
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