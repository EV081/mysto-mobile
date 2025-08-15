import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { UsersResponseDto } from '@interfaces/user/UsersResponseDto';
import { getThemeColors, COLORS } from '@constants/colors';

interface FieldConfig {
  key: string;
  label: string;
  value: string;
  placeholder: string;
  icon: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
}

interface EditUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: Record<string, string>) => void;
  user: UsersResponseDto;
  editType: 'profile' | 'password';
  loading: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ 
  visible, 
  onClose, 
  onSave, 
  user,
  editType,
  loading 
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const isDark = colorScheme === 'dark';

  const getModalConfig = (): { title: string; subtitle: string; fields: FieldConfig[] } => {
    switch (editType) {
      case 'profile':
        return {
          title: '✏️ Editar Perfil',
          subtitle: 'Actualiza tu información personal',
          fields: [
            {
              key: 'name',
              label: 'Nombre completo',
              value: user.name,
              placeholder: 'Ingresa tu nombre completo',
              icon: '👤',
            },
            {
              key: 'email',
              label: 'Correo electrónico',
              value: user.email,
              placeholder: 'Ingresa tu email',
              keyboardType: 'email-address',
              icon: '✉️',
            },
          ],
        };
      case 'password':
        return {
          title: '🔒 Cambiar Contraseña',
          subtitle: 'Establece una nueva contraseña segura',
          fields: [
            {
              key: 'password',
              label: 'Nueva contraseña',
              value: '',
              placeholder: 'Ingresa la nueva contraseña',
              secureTextEntry: true,
              icon: '🔑',
            },
          ],
        };
    }
  };

  const config = getModalConfig();

  useEffect(() => {
    if (visible) {
      const initialData: Record<string, string> = {};
      config.fields.forEach(field => {
        initialData[field.key] = field.value.toString();
      });
      setFormData(initialData);
    }
  }, [visible, editType]);

  const handleSave = () => {
    onSave(formData);
  };

  const getModalColor = () => {
    switch (editType) {
      case 'profile':
        return COLORS.primary;
      case 'password':
        return '#3b82f6';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.textSecondary + '20' }]}>
            <View style={styles.headerContent}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {config.title}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {config.subtitle}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: colors.textSecondary + '20' }]}
              onPress={onClose} 
              disabled={loading}
            >
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {config.fields.map((field) => (
              <View key={field.key} style={styles.inputContainer}>
                <View style={styles.labelContainer}>
                  <Text style={styles.inputIcon}>{field.icon}</Text>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    {field.label}
                  </Text>
                </View>
                <View style={[
                  styles.inputWrapper,
                  { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                  }
                ]}>
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    value={formData[field.key] || ''}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, [field.key]: text }))}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={field.secureTextEntry}
                    keyboardType={field.keyboardType || 'default'}
                    editable={!loading}
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.textSecondary + '20' }]}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { 
                borderColor: colors.textSecondary + '40',
                backgroundColor: 'transparent'
              }]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, { backgroundColor: getModalColor() }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    minHeight: 50,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditUserModal;