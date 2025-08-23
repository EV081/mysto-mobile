import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthContext } from '@contexts/AuthContext';
import RegisterForm from '@components/RegisterForm';
import KeyboardAwareScrollView from '@components/KeyboardAwareScrollView';
import { ActivityIndicator } from 'react-native-paper';
import { COLORS, getThemeColors } from '@constants/colors';
import { useToast } from '@hooks/useToast';
import Toast from '@components/common/Toast';

export default function RegisterScreen() {
  const { register, isLoading } = useAuthContext();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  const [isRegistering, setIsRegistering] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();

  const handleRegister = async (name: string, email: string, password: string) => {
    if (isRegistering) return;
    setIsRegistering(true);
    try {
      await register({ name, email, password }); 
      showSuccess('Cuenta creada correctamente.');
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;

      if (!err?.response) {
        showError('No hay conexión con el servidor. Intenta de nuevo.');
      } else if (status === 409) {
        showError(msg || 'Ya existe una cuenta con ese correo.');
      } else if (status === 400) {
        showError(msg || 'Datos inválidos. Revisa el formulario.');
      } else {
        showError(msg || 'Error al crear la cuenta. Intenta de nuevo.');
      }
      console.error('Error en registro:', err);
    }finally {
      setIsRegistering(false);
    }
  };

  const handleLoginPress = () => navigation.navigate('Login' as never);
  const handleBack = () => navigation.navigate('Welcome' as never);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando...</Text>
      </View>
    );
  }

  return (
     <>
    <KeyboardAwareScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity
        style={[
          styles.backButton,
          { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
        ]}
        onPress={handleBack}
      >
        <Text style={[styles.backButtonIcon, { color: COLORS.primary }]}>←</Text>
      </TouchableOpacity>

      <View style={styles.formContainer}>
        <RegisterForm
          onSubmit={handleRegister}
          isLoading={isRegistering}
          inputBg={colors.cardBackground}
          inputText={colors.text}
          buttonColor={COLORS.primary}
          buttonTextColor={colors.buttonText}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          ¿Ya tienes una cuenta?
        </Text>
        <Text style={[styles.loginLink, { color: COLORS.primary }]} onPress={handleLoginPress}>
          Inicia sesión aquí
        </Text>
      </View>
    </KeyboardAwareScrollView>

    <Toast
      visible={toast.visible}
      message={toast.message}
      type={toast.type}         
      onHide={hideToast}
    />
  </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontWeight: '500', marginTop: 12 },
  backButton: {
    position: 'absolute',
    top: 32,
    left: 16,
    zIndex: 10,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonIcon: { fontSize: 22, fontWeight: 'bold' },
  logo: { width: 160, height: 90, alignSelf: 'center' },
  formContainer: { width: '100%', marginBottom: 30 },
  footer: { alignItems: 'center', marginTop: 10 },
  footerText: { fontSize: 14, marginBottom: 4 },
  loginLink: { fontSize: 14, fontWeight: '600' },
});
