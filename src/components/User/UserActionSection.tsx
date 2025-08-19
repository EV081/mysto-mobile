import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';

interface UserActionsSectionProps {
  onChangePassword: () => void;
}

const UserActionsSection: React.FC<UserActionsSectionProps> = ({ 
  onChangePassword
}) => {
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
      <Text style={[styles.sectionTitle, { color: '#7C3AED' }]}>
        <Text style={{ color: '#000000ff' }}> Configuración de Cuenta</Text>
      </Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[
            styles.actionCard,
            {
              backgroundColor: '#8685e7ff',
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#ffffffff',
              elevation: 2,
            }
          ]}
          onPress={onChangePassword}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#ffffffff', borderRadius: 10 }]}>
            <Text style={[styles.actionEmoji, { color: '#fff' }]}>🔒</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={[styles.actionTitle, { color: 'white' }]}>
              Cambiar contraseña
            </Text>
            <Text style={[styles.actionSubtitle, { color: '#EDE9FE' }]}>
              Actualiza tu contraseña por seguridad
            </Text>
          </View>
          <Text style={[styles.actionArrow, { color: '#ffffffff' }]}>
            →
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.footerText, { color: '#7C3AED' }]}>
        Desliza hacia abajo para actualizar la información
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionsContainer: {
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 0,
    marginBottom: 0,
    elevation: 0,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionEmoji: {
    fontSize: 20,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
  },
  actionArrow: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
  },
});

export default UserActionsSection;