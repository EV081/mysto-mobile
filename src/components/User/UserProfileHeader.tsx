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
  const colors = getThemeColors(colorScheme === 'dark');
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

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'COLLAB':
        return 'Colaborador';
      case 'CUSTOMER':
        return 'Cliente';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'COLLAB':
        return '#3b7df6ff';
      case 'CUSTOMER':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  return (
    <View style={[styles.header, { 
      backgroundColor: isDark 
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)'
        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)'
    }]}>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {user.url_image ? (
            <Image source={{ uri: user.url_image }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.editImageButton, { backgroundColor: COLORS.primary }]}
            onPress={changeProfileImage}
            activeOpacity={0.8}
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
          <Text style={[styles.userName, { color: colors.text }]}>
            {user.name}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user.email}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(user.role) }]}>
            <Text style={styles.roleText}>
              {getRoleDisplayName(user.role)}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.userIdCard, { 
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
      }]}>
        <Text style={[styles.idLabel, { color: colors.textSecondary }]}>
          ID de usuario
        </Text>
        <Text style={[styles.idValue, { color: colors.text }]}>
          #{user.id}
        </Text>
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
    marginBottom: 20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  editImageIcon: {
    fontSize: 14,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 12,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  userIdCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  idLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  idValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UserProfileHeader;