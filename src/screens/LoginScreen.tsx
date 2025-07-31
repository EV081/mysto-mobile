import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, useColorScheme } from 'react-native';
import { useAuthContext } from '@contexts/AuthContext';
import LoginForm from '@components/LoginForm';
import KeyboardAwareScrollView from '@components/KeyboardAwareScrollView';
import { useNavigation } from '@react-navigation/native';
import { COLORS, getThemeColors } from '@constants/colors';

export default function LoginScreen() {
  const { login } = useAuthContext();
  const navigation = useNavigation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const isDark = colorScheme === 'dark';

  const handleLogin = async (email: string, password: string) => {
    setIsLoggingIn(true);
    try {
      await login({ email, password });
      // La navegación se maneja automáticamente en el AuthContext
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterPress = () => {
    navigation.navigate('Register' as never);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (isLoggingIn) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando...</Text>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Botón de retroceso */}
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} 
        onPress={handleBack}
      >
        <Text style={[styles.backButtonIcon, { color: COLORS.primary }]}>←</Text>
      </TouchableOpacity>
      
      <View style={styles.formContainer}>
        <LoginForm 
          onSubmit={handleLogin}
          isLoading={isLoggingIn}
          inputBg={colors.cardBackground}
          inputText={colors.text}
          buttonColor={COLORS.primary}
          buttonTextColor={colors.buttonText}
        />
      </View>
      
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          ¿No tienes una cuenta?
        </Text>
        <Text 
          style={[styles.registerLink, { color: COLORS.primary }]} 
          onPress={handleRegisterPress}
        >
          Regístrate aquí
        </Text>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
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
  backButtonIcon: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
    marginBottom: 30,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    fontSize: 14,
    marginBottom: 4,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 