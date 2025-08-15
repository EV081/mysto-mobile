import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { UsersResponseDto } from '@interfaces/user/UsersResponseDto';
import { getThemeColors, COLORS } from '@constants/colors';

interface UserInfoCardsProps {
  user: UsersResponseDto;
  onEditProfile: () => void;
}

const UserInfoCards: React.FC<UserInfoCardsProps> = ({ user, onEditProfile }) => {
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Información Personal
        </Text>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: COLORS.primary }]}
          onPress={onEditProfile}
        >
          <Text style={styles.editButtonText}>✏️ Editar</Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.infoCard, { 
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)'
      }]}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Nombre completo
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user.name}
            </Text>
          </View>
        </View>
        
        <View style={[styles.divider, { backgroundColor: colors.textSecondary + '20' }]} />
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Correo electrónico
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user.email}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoRow: {
    paddingVertical: 8,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
});

export default UserInfoCards;