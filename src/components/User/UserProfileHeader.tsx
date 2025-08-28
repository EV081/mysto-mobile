import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { UsersResponseDto } from '@interfaces/user/UsersResponseDto';
import { getThemeColors, COLORS } from '@constants/colors';

interface UserProfileHeaderProps {
  user: UsersResponseDto;
  onImageUpdate: (imageUri: string) => void;
  updatingImage: boolean;
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({ 
  user, 
  onImageUpdate, 
  updatingImage 
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const changeProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        onImageUpdate(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo acceder a la galería de imágenes');
    }
  };

  return (
    <View style={[
      styles.header,
      {
        backgroundColor: isDark ? '#23223a' : '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#000000ff',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 20,
        marginHorizontal: 12, 
      }
    ]}>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {user.url_image ? (
            <Image source={{ uri: user.url_image }} style={[styles.avatarImage, { borderWidth: 2, borderColor: '#000000ff' }]} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: isDark ? '#23223a' : '#F3F4F6', borderWidth: 2, borderColor: '#000000ff' }]}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.editImageButton, { backgroundColor: COLORS.primary, borderColor: '#fff' }]}
            onPress={changeProfileImage}
            disabled={updatingImage}
          >
            {updatingImage ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.editImageIcon}>✏️</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: '#374151' }]}>
            {user.name}
          </Text>
          <Text style={[styles.userEmail, { color: COLORS.primary }]}>
            {user.email}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 24,
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    // borderColor y borderWidth se sobrescriben arriba
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    // borderColor y borderWidth se sobrescriben arriba
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  editImageIcon: {
    fontSize: 14,
    color: 'white',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    marginBottom: 12,
  },
});

export default UserProfileHeader;