import React from 'react';
import { KeyboardAvoidingView, ScrollView, Platform, StyleSheet, ViewStyle } from 'react-native';

interface KeyboardAwareScrollViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  contentContainerStyle?: ViewStyle | ViewStyle[];
  showsVerticalScrollIndicator?: boolean;
}

export default function KeyboardAwareScrollView({
  children,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}: KeyboardAwareScrollViewProps) {
  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
}); 