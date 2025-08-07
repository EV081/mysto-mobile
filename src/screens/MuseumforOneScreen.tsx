import React, { useEffect, useState } from 'react';
import {
  Linking,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  RefreshControl
} from 'react-native';
import { SafeAreaView, Platform, StatusBar } from 'react-native';
import { COLORS } from '@constants/colors';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getMuseumForId } from '@services/museum/getMuseumforId';
import { getObjectsByMuseumId } from '@services/museum/getListarObjetsforMuseum';
import { deleteMuseum } from '@services/museum/delteMuseum';
import { deleteCulturalObject } from '@services/culturalObject/deleteCulturalObject';
import { getRoleBasedOnToken } from '@utils/getRoleBasedOnToken';
import { useAuthContext } from '@contexts/AuthContext';

import CulturalObjectForm from '@components/CulturalObjectForm';

export default function MuseumforOneScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const museumId = route?.params?.museumId;
  const onMuseumDeleted = route?.params?.onMuseumDeleted;
  const { session } = useAuthContext();

  // Todos los hooks al principio
  const [museum, setMuseum] = useState<any>(null);
  const [objects, setObjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingObject, setEditingObject] = useState<any>(null);

  useEffect(() => {
    if (!museumId) return;
    fetchMuseum();
  }, [museumId]);

  useEffect(() => {
    if (session) {
      const role = getRoleBasedOnToken(session);
      setUserRole(role);
    }
  }, [session]);

  const fetchMuseum = async () => {
    setLoading(true);
    try {
      const response = await getMuseumForId(museumId);
      setMuseum(response.data);

      const objectsData = await getObjectsByMuseumId(museumId);
      setObjects(objectsData);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar el museo');
    }
    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      // Recargar tanto el museo como los objetos culturales
      const [museumResponse, objectsData] = await Promise.all([
        getMuseumForId(museumId),
        getObjectsByMuseumId(museumId)
      ]);
      
      setMuseum(museumResponse.data);
      setObjects(objectsData);
    } catch (e) {
      Alert.alert('Error', 'No se pudo recargar los datos');
    }
    setRefreshing(false);
  };

  // Ahora sí los retornos condicionales vienen **después** de los hooks
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

function formatHour(time?: string) {
  if (!time || !time.includes(':')) return '—';
  const [hourStr, minute] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const suffix = hour < 12 ? 'a.m.' : 'p.m.';
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${suffix}`;
}

const openInMaps = (lat: number, lon: number) => {
  const url = Platform.select({
    ios: `http://maps.apple.com/?ll=${lat},${lon}`,
    android: `http://maps.google.com/?q=${lat},${lon}`
  });

  if (url) {
    Linking.openURL(url);
  } else {
    Alert.alert('Error', 'No se pudo abrir el mapa en esta plataforma.');
  }
};

const handleDeleteMuseum = () => {
  Alert.alert(
    'Confirmar eliminación',
    '¿Estás seguro de que deseas eliminar este museo?',
    [
      {
        text: 'No',
        style: 'cancel',
      },
      {
        text: 'Sí',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMuseum(museumId);
            Alert.alert('Éxito', 'Museo eliminado correctamente');
            // Notificar al MuseumScreen que debe recargar la lista
            if (onMuseumDeleted) {
              onMuseumDeleted();
            }
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar el museo');
          }
        },
      },
    ]
  );
};

const handleCreateCulturalObject = async () => {
  setFormLoading(true);
  try {
    // Recargar todos los datos después de crear/editar el objeto cultural
    await refreshData();
    setShowForm(false);
    setEditingObject(null);
  } catch (error) {
    Alert.alert('Error', 'No se pudo recargar los datos');
  }
  setFormLoading(false);
};

const handleEditCulturalObject = (object: any) => {
  setEditingObject(object);
  setShowForm(true);
};

// Función para manejar la eliminación de objetos culturales
const handleDeleteCulturalObject = async (objectId: number) => {
  Alert.alert(
    'Confirmar eliminación',
    '¿Estás seguro de que deseas eliminar este objeto cultural?',
    [
      {
        text: 'No',
        style: 'cancel',
      },
      {
        text: 'Sí',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCulturalObject(objectId);
            
            // Recargar los datos después de eliminar
            await refreshData();
            Alert.alert('Éxito', 'Objeto cultural eliminado correctamente');
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar el objeto cultural');
          }
        },
      },
    ]
  );
};

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
            <View style={{ height: 0 }} />
            {museum.pictureUrls && museum.pictureUrls.length > 0 && (
              <Image source={{ uri: museum.pictureUrls[0] }} style={styles.image} />
            )}
            <Text style={styles.title}>{museum.name}</Text>
            <Text style={styles.desc}>{museum.description}</Text>
            <TouchableOpacity onPress={() => openInMaps(museum.latitud, museum.longitud)}>
            <Text style={[styles.info, { color: 'blue', textDecorationLine: 'underline' }]}>
              Ver en el mapa
            </Text>
            </TouchableOpacity>

            {museum.openTime && museum.closeTime && (
            <Text style={styles.info}>
            Abre: {formatHour(museum.openTime)} - Cierra: {formatHour(museum.closeTime)}
            </Text>
        )}
            <Text style={styles.sectionTitle}>Objetos culturales</Text>
            {objects.length === 0 ? (
              <Text style={styles.info}>No hay objetos culturales asociados.</Text>
            ) : (
              <FlatList
                data={objects}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.objectCard}>
                    {item.pictureUrls && item.pictureUrls.length > 0 && (
                    <Image source={{ uri: item.pictureUrls[0] }} style={styles.objectImage} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.objectTitle}>{item.name}</Text>
                      <Text style={styles.objectDesc}>{item.description}</Text>
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
        </View>
        </ScrollView>
        
        {/* Botón flotante para agregar objetos culturales - Solo visible para COLLAB */}
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
                museumId={museumId}
                onSuccess={handleCreateCulturalObject}
                onCancel={() => {
                  setShowForm(false);
                  setEditingObject(null);
                }}
                loading={formLoading}
                editMode={!!editingObject}
                culturalObject={editingObject}
              />
            </View>
          </View>
        </Modal>
      </View>
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
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16
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
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    elevation: 1
  },
  objectImage: {
    width: 50,
    height: 50,
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
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  editObjectText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  deleteObjectButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#ff4444',
    borderRadius: 4,
  },
  deleteObjectText: {
    color: '#fff',
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
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',         // ← alinea verticalmente al centro
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,           // ← puedes ajustar esto si quieres menos alto
    backgroundColor: '#fff',
  },
  headerLine: {
    height: 2,
    backgroundColor: '#e5e7eb',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  backArrow: {
    fontSize: 28,
    color: COLORS.primary,
    marginRight: 12,
    lineHeight: 28, // ← aysuda a centrar verticalmente
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
    color: '#ff4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
    maxHeight: '80%',
  },
});
