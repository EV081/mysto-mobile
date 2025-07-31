import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Button } from 'react-native-paper';

interface RegisterFormProps {
  onSubmit: (name: string, email: string, password: string) => Promise<void>;
  isLoading?: boolean;
  inputBg?: string;
  inputText?: string;
  buttonColor?: string;
  buttonTextColor?: string;
}

export default function RegisterForm({ 
  onSubmit, 
  isLoading = false,
  inputBg = '#ffffff',
  inputText = '#1e293b',
  buttonColor = '#7300BF',
  buttonTextColor = '#ffffff'
}: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (name.length < 2) {
      Alert.alert('Error', 'El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'El email no es válido');
      return;
    }

    if (password.length < 4) {
      Alert.alert('Error', 'La contraseña debe tener al menos 4 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      await onSubmit(name.trim(), email.trim(), password);
    } catch (error) {
      console.error('Error en registro:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.formContainer, { backgroundColor: inputBg }]}>
        <Text style={[styles.title, { color: inputText }]}>Crear Cuenta</Text>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: inputText }]}>Nombre</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: inputText, borderColor: inputText + '20' }]}
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor={inputText + '60'}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>

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

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: inputText }]}>Confirmar Contraseña</Text>
          <View style={[styles.passwordContainer, { backgroundColor: inputBg, borderColor: inputText + '20' }]}>
            <TextInput
              style={[styles.passwordInput, { color: inputText }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirma tu contraseña"
              placeholderTextColor={inputText + '60'}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              <Text style={styles.eyeIcon}>
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
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
          {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
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