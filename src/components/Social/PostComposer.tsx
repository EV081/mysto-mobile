import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { Button, Dialog, Portal, TextInput, HelperText, ActivityIndicator, Searchbar, List, Divider } from 'react-native-paper';
import ImageUploader from '@components/common/ImageUploader';
import { createPost } from '@services/post/createPost';
import { uploadPostPictures } from '@services/pictures/uploadPostPictures';
import { getPagedMuseums } from '@services/museum/getListarMuseums';
import type { MuseumResponse } from '@interfaces/museum/MuseumResponse';
import { COLORS } from '@constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function PostComposer({ visible, onClose, onCreated }: Props) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [museums, setMuseums] = useState<MuseumResponse[]>([]);
  const [museumId, setMuseumId] = useState<number | null>(null);
  const [museumName, setMuseumName] = useState<string>('');
  const [loadingMuseums, setLoadingMuseums] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    const loadMuseums = async () => {
      setLoadingMuseums(true);
      try {
        const res = await getPagedMuseums(0, 100);
        setMuseums(res.contents || []);
      } catch (err) {
        console.error('Error loading museums:', err);
        setError('Error al cargar los museos');
      } finally {
        setLoadingMuseums(false);
      }
    };

    loadMuseums();
  }, [visible]);

  const filteredMuseums = useMemo(() => {
    if (!search.trim()) {
      return museums.slice(0, 5);
    }
    const q = search.trim().toLowerCase();
    return museums.filter(m => m.name?.toLowerCase().includes(q));
  }, [museums, search]);

  const openPicker = () => {
    setPickerOpen(true);
    setSearch('');
  };

  const selectMuseum = (m: MuseumResponse) => {
    setMuseumId(m.id);
    setMuseumName(m.name ?? '');
    setPickerOpen(false);
    setError(null);
  };

  const clearMuseum = () => {
    setMuseumId(null);
    setMuseumName('');
  };

  const onSubmit = async () => {
    try {
      setError(null);

      if (!content.trim()) {
        setError('El contenido del post no puede estar vacío');
        return;
      }
      if (!museumId) {
        setError('Selecciona un museo.');
        return;
      }

      setSubmitting(true);

      const created = await createPost(museumId, { content: content.trim() });

      if (images.length > 0) {
        try {
          // Filtrar imágenes válidas
          const validImages = images.filter(img => {
            const uri = (img && (img.uri || img.url)) || img;
            return uri && typeof uri === 'string' && uri.trim() !== '';
          });

          if (validImages.length > 0) {
            console.log(`Subiendo ${validImages.length} imágenes para el post ${created.id}`);
            
            for (const img of validImages) {
              const uri = (img && (img.uri || img.url)) || img;
              if (uri && typeof uri === 'string') {
                console.log('Subiendo imagen:', uri);
                await uploadPostPictures(created.id, uri);
              }
            }
          } else {
            console.warn('No hay imágenes válidas para subir');
          }
        } catch (err) {
          console.error('Error uploading images:', err);
          console.warn('Algunas imágenes no se pudieron subir, pero el post se creó correctamente');
        }
      }
      
      setContent('');
      setImages([]);
      clearMuseum();

      onCreated();
    } catch (e: any) {
      console.error('Error creating post:', e);
      setError(e?.message ?? 'Error creando el post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setImages([]);
    clearMuseum();
    setError(null);
    setPickerOpen(false);
    onClose();
  };

  return (
    <Portal>
      {visible && <View style={styles.backdrop} />}
      <Dialog visible={visible} onDismiss={handleClose} style={styles.dialog}>
        <Dialog.Title>Nuevo post</Dialog.Title>
        <Dialog.Content>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput
              mode="outlined"
              placeholder="¿Qué quieres compartir?"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              style={styles.textInput}
              outlineColor={COLORS.primary}
              activeOutlineColor={COLORS.primary}
            />

            <View style={styles.museumRow}>
              <Button
                mode="outlined"
                onPress={openPicker}
                style={styles.museumButton}
                labelStyle={{ color: COLORS.primary }}
                icon="office-building"
              >
                {museumId ? `Museo: ${museumName}` : 'Asocia tu post a un museo'}
              </Button>

              {museumId && (
                <Button
                  mode="text"
                  onPress={clearMuseum}
                  compact
                  icon="close"
                  buttonColor={COLORS.primary}
                  labelStyle={{ color: COLORS.white, fontWeight: '600' }}
                  uppercase={false}
                >
                  Quitar
                </Button>
              )}
            </View>

            <ImageUploader
              images={images}
              onImagesChange={setImages}
              title="Imágenes del post"
              buttonText="Agregar imágenes"
              maxImages={10}
            />

            {!!error && <HelperText type="error">{error}</HelperText>}
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            mode="text"
            onPress={handleClose}
            disabled={submitting}
            labelStyle={{ color: COLORS.primary }}
            rippleColor="rgba(104, 67, 0, 0.2)" // usa tu COLORS.primary con algo de alpha
          >
            Cancelar
          </Button>
          <Button
            loading={submitting}
            disabled={submitting || !content.trim() || !museumId}
            mode="contained"
            onPress={onSubmit}
            style={{ backgroundColor: COLORS.primary }}
            labelStyle={{ color: COLORS.white }}
          >
            Publicar
          </Button>
        </Dialog.Actions>
      </Dialog>

      {pickerOpen && <View style={styles.backdrop} />}
      <Dialog visible={pickerOpen} onDismiss={() => setPickerOpen(false)} style={styles.pickerDialog}>
        <Dialog.Title>Selecciona un museo</Dialog.Title>
        <Dialog.Content>
          {loadingMuseums ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <HelperText type="info">Cargando museos...</HelperText>
            </View>
          ) : (
            <>
              <Searchbar
                placeholder="Buscar museo..."
                value={search}
                onChangeText={setSearch}
                inputStyle={{ color: COLORS.black }} 
                style={[styles.searchbar, { backgroundColor: '#fff' }]} 
                iconColor={COLORS.primary}    
              />

              {filteredMuseums.length === 0 ? (
                <HelperText type="info">No se encontraron museos.</HelperText>
              ) : (
                <FlatList
                  data={filteredMuseums}
                  keyExtractor={(item) => String(item.id)}
                  ItemSeparatorComponent={Divider}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => selectMuseum(item)}>
                      <List.Item
                        title={item.name}
                        description={item.description || undefined}
                        left={(props) => <List.Icon {...props} icon="domain" />}
                        right={(props) => (museumId === item.id ? <List.Icon {...props} icon="check" /> : null)}
                      />
                      <Divider style={{ backgroundColor: COLORS.primary, height: 1 }} />
                    </TouchableOpacity>
                  )}
                  style={styles.list}
                />
              )}
            </>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            mode="contained"
            onPress={() => setPickerOpen(false)}
            buttonColor={COLORS.primary}  
            textColor="#fff"              
            style={{ borderRadius: 8 }}    
          >
            Cerrar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
    backgroundColor: COLORS.background,
    zIndex: 1,
  },
  pickerDialog: {
    maxHeight: '80%',
    backgroundColor: COLORS.background,
    zIndex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139,69,19,0.35)', 
    zIndex: 0,
  },
  textInput: {
    marginBottom: 16,         
    backgroundColor: COLORS.white, 
    paddingVertical: 1,
    paddingHorizontal: 1
  },
  museumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  museumButton: {
  flex: 1,
  borderColor: COLORS.primary,
  borderWidth: 1,
  },
  clearButton: {
    marginLeft: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  searchbar: {
    marginBottom: 8,
  },
  list: {
    maxHeight: 320,
  },
});
