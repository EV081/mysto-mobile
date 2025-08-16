import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from '@contexts/AuthContext';
import AppNavigator from '@navigation/AppNavigator';
import { StripeProvider } from '@stripe/stripe-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <StripeProvider publishableKey={process.env.EXPO_STRIPE_PUBLISHABLE_KEY}>
            <AuthProvider>
              <AppNavigator />
              <StatusBar style="auto" />
            </AuthProvider>
          </StripeProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
