import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '@services/users/currentUser';
import { uploadProfileImage } from '@services/users/uploadProfileImage';
import { updateUser } from '@services/users/updateUser';
import { UsersResponseDto } from '@interfaces/user/UsersResponseDto';
import { UpdateUserRequestDto } from '@interfaces/user/UpdateUserRequestDto';
import { getThemeColors, COLORS } from '@constants/colors';
import { useAuthContext } from '@contexts/AuthContext';
import UserProfileHeader from '@components/User/UserProfileHeader';
import UserInfoCards from '@components/User/UserInfoCards';
import UserStatsCards from '@components/User/UserStatsCards';
import UserActionsSection from '@components/User/UserActionSection';
import EditUserModal from '@components/User/EditUserModal';
import { Text } from 'react-native';

export default function UserScreen() {
  const [user, setUser] = useState<UsersResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingImage, setUpdatingImage] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editType, setEditType] = useState<'profile' | 'password'>('profile');
  const [editModalLoading, setEditModalLoading] = useState(false);
  const { logout } = useAuthContext();
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');

  const fetchUserData = async () => {
    try {
      const response = await getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert(
        'Error',
        'No se pudo cargar la información del usuario. Por favor, inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpdate = async (imageUri: string) => {
    if (!user) return;

    setUpdatingImage(true);
    try {
      const imageUrl = await uploadProfileImage(imageUri);
      await updateUser(user.id, { url_image: imageUrl } as any);
      setUser(prevUser => prevUser ? { ...prevUser, url_image: imageUrl } : null);
      
      Alert.alert(
        'Imagen actualizada',
        'La imagen de perfil se ha actualizado correctamente.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error updating profile image:', error);
      
      let errorMessage = 'No se pudo actualizar la imagen de perfil. Inténtalo de nuevo.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setUpdatingImage(false);
    }
  };

  const handleEditUser = async (formData: Record<string, string>) => {
    if (!user) return;

    setEditModalLoading(true);

    try {
      const updateData: UpdateUserRequestDto = {};

      Object.keys(formData).forEach(key => {
        const value = formData[key].trim();
        
        if (key === 'coins' || key === 'points') {
          const numericValue = Number(value);
          if (!isNaN(numericValue) && numericValue >= 0 && numericValue !== user[key as keyof UsersResponseDto]) {
            (updateData as any)[key] = numericValue;
          }
        } else if (value && value !== user[key as keyof UsersResponseDto]?.toString()) {
          (updateData as any)[key] = value;
        }
      });

      if (Object.keys(updateData).length === 0) {
        Alert.alert('Sin cambios', 'No se detectaron cambios en los datos.');
        setEditModalVisible(false);
        return;
      }

      const response = await updateUser(user.id, updateData);
      setUser(response.data);

      setEditModalVisible(false);
      Alert.alert(
        'Actualización exitosa',
        'Los datos se han actualizado correctamente.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error updating user:', error);
      
      let errorMessage = 'No se pudieron actualizar los datos. Inténtalo de nuevo.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setEditModalLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const openEditModal = (type: 'profile' | 'password') => {
    setEditType(type);
    setEditModalVisible(true);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando información del usuario...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            No se pudo cargar la información del usuario
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <UserProfileHeader 
          user={user}
          onImageUpdate={handleImageUpdate}
          updatingImage={updatingImage}
        />

        <UserInfoCards 
          user={user}
          onEditProfile={() => openEditModal('profile')}
        />

        <UserStatsCards 
          user={user}
        />

        <UserActionsSection 
          onChangePassword={() => openEditModal('password')}
          onLogout={handleLogout}
        />
      </ScrollView>

      <EditUserModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={handleEditUser}
        user={user}
        editType={editType}
        loading={editModalLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});