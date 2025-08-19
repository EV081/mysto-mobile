import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { UsersResponseDto } from '@interfaces/user/UsersResponseDto';
import { useModal } from '@contexts/ModalContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

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
  const [passwordError, setPasswordError] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { hideLogoutModal } = useModal();

  const getModalConfig = (): { title: string; subtitle: string; fields: FieldConfig[] } => {
    switch (editType) {
      case 'profile':
        return {
          title: 'Editar Perfil',
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
          title: 'Cambiar Contraseña',
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
            {
              key: 'confirmPassword',
              label: 'Repite la nueva contraseña',
              value: '',
              placeholder: 'Repite la nueva contraseña',
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
      setPasswordError('');
    }
  }, [visible, editType]);

  const handleSave = () => {
    if (editType === 'password') {
      if (!formData.password || !formData.confirmPassword) {
        setPasswordError('Por favor ingresa ambas contraseñas.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setPasswordError('Las contraseñas no coinciden.');
        return;
      }
      onSave({ password: formData.password });
    } else {
      onSave(formData);
    }
  };

  const modalBg = isDark ? '#fff' : '#fff';
  const borderColor = '#000';
  const green = '#22c55e';
  const purple = '#7C3AED';
  const textColor = '#111'; 

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={styles.fullScreenOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centeredView}
        >
          <View style={[
            styles.modalContent,
            {
              backgroundColor: modalBg,
              borderColor,
            }
          ]}>
            <View style={styles.header}>
              <Text style={styles.icon}>{editType === 'profile' ? '✏️' : '🔒'}</Text>
              <Text style={[styles.title, { color: borderColor }]}>
                {config.title}
              </Text>
              <Text style={[styles.subtitle, { color: textColor }]}>
                {config.subtitle}
              </Text>
            </View>
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {config.fields.map((field) => (
                <View key={field.key} style={styles.inputContainer}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.inputIcon}>{field.icon}</Text>
                    <Text style={[styles.inputLabel, { color: textColor }]}>
                      {field.label}
                    </Text>
                  </View>
                  <View style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: '#F3F4F6',
                      borderColor: borderColor,
                    }
                  ]}>
                    <TextInput
                      style={[styles.textInput, { color: textColor }]}
                      value={formData[field.key] || ''}
                      onChangeText={(text) => {
                        setFormData(prev => ({ ...prev, [field.key]: text }));
                        if (editType === 'password') setPasswordError('');
                      }}
                      placeholder={field.placeholder}
                      placeholderTextColor={'#888'}
                      secureTextEntry={field.secureTextEntry}
                      keyboardType={field.keyboardType || 'default'}
                      editable={!loading}
                    />
                  </View>
                </View>
              ))}
              {editType === 'password' && passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </ScrollView>
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  {
                    backgroundColor: '#c2c2c2ff',
                    borderColor: '#888',
                  }
                ]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={[styles.cancelButtonText, { color: '#ffffffff' }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  { backgroundColor: purple }
                ]}
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
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredView: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    width: '100%',
    height: '100%',
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    width: '100%',
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 18,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    borderColor: '#000',
  },
  textInput: {
    padding: 14,
    fontSize: 15,
    minHeight: 44,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {},
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default EditUserModal;