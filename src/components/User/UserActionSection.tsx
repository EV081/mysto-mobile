import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { getThemeColors } from '@constants/colors';

interface UserActionsSectionProps {
  onChangePassword: () => void;
  onLogout: () => void;
}

const UserActionsSection: React.FC<UserActionsSectionProps> = ({ 
  onChangePassword, 
  onLogout 
}) => {
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Configuración de Cuenta
      </Text>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionCard, { 
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            borderColor: '#3b82f630'
          }]}
          onPress={onChangePassword}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#3b82f620' }]}>
            <Text style={styles.actionEmoji}>🔒</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              Cambiar contraseña
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              Actualiza tu contraseña por seguridad
            </Text>
          </View>
          <Text style={[styles.actionArrow, { color: '#3b82f6' }]}>
            →
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onLogout}
          style={[styles.logoutButton, { 
            borderColor: '#ef4444',
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'
          }]}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.footerText, { color: colors.textSecondary }]}>
        Desliza hacia abajo para actualizar la información
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionEmoji: {
    fontSize: 20,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
  },
  actionArrow: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
  },
});

export default UserActionsSection;