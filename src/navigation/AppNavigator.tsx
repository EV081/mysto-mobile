import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAuthState } from '@hooks/useAuth';
import LoginScreen from '@screens/LoginScreen';
import RegisterScreen from '@screens/RegisterScreen';
import WelcomeScreen from '@screens/WelcomeScreen';
import DrawerNavigator from './DrawerNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { session, isLoading, isAuthenticated, autoLogin } = useAuthState();
  const [isAutoLoginAttempted, setIsAutoLoginAttempted] = useState(false);

  useEffect(() => {
    const attemptAutoLogin = async () => {
      if (!isLoading && !isAuthenticated && !isAutoLoginAttempted) {
        setIsAutoLoginAttempted(true);
        try {
          await autoLogin();
        } catch (error) {
          console.error('Error en auto-login:', error);
        }
      }
    };

    attemptAutoLogin();
  }, [isLoading, isAuthenticated, isAutoLoginAttempted, autoLogin]);

  // Mostrar pantalla de carga mientras se valida la autenticación
  if (isLoading || (!isAuthenticated && !isAutoLoginAttempted)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>
          Verificando autenticación...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={DrawerNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
}); 