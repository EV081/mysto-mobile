import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {  getThemeColors } from '@constants/colors';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Pantalla Principal
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Implementación pendiente
        </Text>
        
        {/* Aquí puedes agregar tu contenido */}
        <View style={[styles.placeholder, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            🏛️ Contenido de la aplicación
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  placeholder: {
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    width: '100%',
  },
  placeholderText: {
    fontSize: 18,
    textAlign: 'center',
  },
}); 