import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Button } from 'react-native-paper';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  inputBg?: string;
  inputText?: string;
  buttonColor?: string;
  buttonTextColor?: string;
}

export default function LoginForm({ 
  onSubmit, 
  isLoading = false,
  inputBg = '#ffffff',
  inputText = '#1e293b',
  buttonColor = '#7300BF',
  buttonTextColor = '#ffffff'
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password.length < 4) {
      Alert.alert('Error', 'La contraseña debe tener al menos 4 caracteres');
      return;
    }

    try {
      await onSubmit(email.trim(), password);
    } catch (error) {
      console.error('Error en login:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.formContainer, { backgroundColor: inputBg }]}>
        <Text style={[styles.title, { color: inputText }]}>Iniciar Sesión</Text>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: inputText }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: inputText, borderColor: inputText + '20' }]}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor={inputText + '60'}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: inputText }]}>Contraseña</Text>
          <View style={[styles.passwordContainer, { backgroundColor: inputBg, borderColor: inputText + '20' }]}>
            <TextInput
              style={[styles.passwordInput, { color: inputText }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña"
              placeholderTextColor={inputText + '60'}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Text style={styles.eyeIcon}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          style={[styles.submitButton, { backgroundColor: buttonColor }]}
          labelStyle={[styles.submitButtonText, { color: buttonTextColor }]}
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  formContainer: {
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 