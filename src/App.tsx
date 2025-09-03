import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from '@contexts/AuthContext';
import { ModalProvider } from '@contexts/ModalContext';
import AppNavigator from '@navigation/AppNavigator';
import { GoalProvider } from '@contexts/GoalContext';
import { StripeProvider } from '@stripe/stripe-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider>
          <StripeProvider publishableKey={process.env.EXPO_STRIPE_PUBLISHABLE_KEY}>
            <AuthProvider>
              <ModalProvider>
                <GoalProvider>
                  <AppNavigator />
                  <StatusBar style="auto" />
                </GoalProvider>
              </ModalProvider>
            </AuthProvider>
          </StripeProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}