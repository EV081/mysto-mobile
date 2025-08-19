import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { UsersResponseDto } from '@interfaces/user/UsersResponseDto';

interface UserInfoCardsProps {
  user: UsersResponseDto;
  onEditProfile: () => void;
}

const UserInfoCards: React.FC<UserInfoCardsProps> = ({ user, onEditProfile }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[
      styles.section,
      {
        backgroundColor: isDark ? '#23223a' : '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#000000ff',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 20,
        marginHorizontal: 12,
      }
    ]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: '#7C3AED' }]}>
          <Text style={{ color: '#000000ff' }}> Información Personal</Text>
        </Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={onEditProfile}
        >
          <Text style={styles.editButtonText}>
            <Text style={{ color: '#ffffffff' }}>✏️</Text> Editar
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: isDark ? '#d1d5db' : '#374151' }]}>
            Nombre completo
          </Text>
          <Text style={[styles.infoValue, { color: '#7C3AED' }]}>
            {user.name}
          </Text>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: '#E5E7EB' }]} />
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: isDark ? '#d1d5db' : '#374151' }]}>
            Correo electrónico
          </Text>
          <Text style={[styles.infoValue, { color: '#7C3AED' }]}>
            {user.email}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
    borderWidth: 1,
    borderColor: '#ffffffff',
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    paddingVertical: 8,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 8,
    borderRadius: 1,
  },
});

export default UserInfoCards;