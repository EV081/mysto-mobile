import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import Toast from '@components/common/Toast';
import { useToast } from '@hooks/useToast';

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
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast, showError, showSuccess, hideToast } = useToast();

  const onlyLettersAndSpaces = (text: string) =>
    text.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');

  const normalizeInline = (text: string) =>
    text.replace(/^\s+/, '').replace(/\s+/g, ' ');

  const normalizeFinal = (text: string) =>
    text.replace(/\s+/g, ' ').trim();

  const isValidName = (normalized: string) => {
    if (normalized.length < 3) return false;
    return /^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:\s[A-Za-zÁÉÍÓÚáéíóúÑñ]+)*$/.test(normalized);
  };

  const handleSubmit = async () => {
    const fn = normalizeFinal(firstName);
    const ln = normalizeFinal(lastName);
    const em = email.trim().toLowerCase();
    const pw = password;
    const cpw = confirmPassword;

    if (!fn || !ln || !em || !pw || !cpw) {
      showError('Por favor completa todos los campos.');
      return;
    }
    if (!isValidName(fn)) {
      showError('El nombre debe tener mínimo 3 letras');
      return;
    }
    if (!isValidName(ln)) {
      showError('El apellido debe tener mínimo 3 letras');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(em)) {
      showError('El email no es válido.');
      return;
    }
    if (pw.trim().length < 6) {
      showError('La contraseña debe tener mínimo 6 caracteres');
      return;
    }
    if (pw !== cpw) {
      showError('Las contraseñas no coinciden.');
      return;
    }

    const fullName = `${fn} ${ln}`;

    await onSubmit(fullName, em, pw);
  };


  return (
    <View style={styles.container}>
      <View style={[styles.formContainer, { backgroundColor: inputBg }]}>
        <Text style={[styles.title, { color: inputText }]}>Crear Cuenta</Text>

        {/* Nombre */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: inputText }]}>Nombre</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: inputText, borderColor: inputText + '20' }]}
            value={firstName}
            onChangeText={(t) => setFirstName(normalizeInline(onlyLettersAndSpaces(t)))}
            placeholder="Tu nombre"
            placeholderTextColor={inputText + '60'}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isLoading}
            maxLength={40}
          />
        </View>

        {/* Apellido */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: inputText }]}>Apellido</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: inputText, borderColor: inputText + '20' }]}
            value={lastName}
            onChangeText={(t) => setLastName(normalizeInline(onlyLettersAndSpaces(t)))}
            placeholder="Tu apellido"
            placeholderTextColor={inputText + '60'}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isLoading}
            maxLength={40}
          />
        </View>

        {/* Email */}
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

        {/* Contraseña */}
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

        {/* Confirmación */}
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

      {/* Toast para el form */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  formContainer: {
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
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
  passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
  eyeButton: { paddingHorizontal: 12, paddingVertical: 8 },
  eyeIcon: { fontSize: 18 },
  submitButton: { borderRadius: 8, paddingVertical: 4 },
  submitButtonText: { fontSize: 16, fontWeight: '600' },
});
