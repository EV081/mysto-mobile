import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, getThemeColors } from '@constants/colors';

const WelcomeScreen = ({ navigation }: any) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getThemeColors(isDark);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: COLORS.primary }]}>Mysto</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Turismo Cultural Gamificado
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={[styles.iconContainer, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.icon}>🏛️</Text>
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Descubre el Arte a través del Misterio
            </Text>
            <Text style={[styles.heroDescription, { color: colors.textSecondary }]}>
              Una experiencia inmersiva que combina tecnología, cultura y gamificación
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🤖</Text>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  Chatbot IA
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Narrativas de misterio guiadas por inteligencia artificial
                </Text>
              </View>
            </View>

            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📱</Text>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  Realidad Aumentada
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Interactúa con objetos reales usando la cámara de tu celular
                </Text>
              </View>
            </View>

            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🎯</Text>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  Gamificación
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Desbloquea tarjetas educativas, pistas y conexiones temáticas
                </Text>
              </View>
            </View>

            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🏆</Text>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  Recompensas
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Completa recorridos y gana recompensas virtuales
                </Text>
              </View>
            </View>
          </View>

          {/* Mission Statement */}
          <View style={[styles.missionContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.missionTitle, { color: colors.text }]}>
              Nuestra Misión
            </Text>
            <Text style={[styles.missionText, { color: colors.textSecondary }]}>
              Creemos que este enfoque puede aportar a la divulgación cultural y 
              educación experiencial, transformando la forma en que las personas 
              interactúan con el patrimonio cultural.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: COLORS.primary }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.primaryButtonText, { color: colors.buttonText }]}>
              Comenzar Aventura
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                borderColor: COLORS.primary,
                backgroundColor: 'transparent',
              },
            ]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={[styles.secondaryButtonText, { color: COLORS.primary }]}>
              Crear Cuenta
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 50,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  featureIcon: {
    fontSize: 30,
    marginRight: 15,
    marginTop: 5,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  missionContainer: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
  },
  missionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  missionText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  actionsContainer: {
    paddingBottom: 30,
  },
  primaryButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WelcomeScreen; 