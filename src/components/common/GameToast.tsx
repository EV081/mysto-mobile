import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@constants/colors';

interface GameToastProps {
  visible: boolean;
  message: string;
  subMessage?: string;
  onHide?: () => void;
  duration?: number;
}

export default function GameToast({ visible, message, subMessage, onHide, duration = 2200 }: GameToastProps) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true })
      ]).start();

      const t = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -80, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true })
        ]).start(({ finished }) => { if (finished) onHide && onHide(); });
      }, duration);

      return () => clearTimeout(t);
    }
  }, [visible, duration, onHide, translateY, opacity, scale]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }, { scale }], opacity }] }>
      <View style={styles.badge}>
        <Ionicons name="trophy" size={18} color={COLORS.white} />
        <Text style={styles.title}>¡OBJETO DESBLOQUEADO!</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
      {subMessage ? <Text style={styles.sub}>{subMessage}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    zIndex: 999,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginBottom: 8,
  },
  title: { color: COLORS.white, fontWeight: '900', letterSpacing: 1, fontSize: 12 },
  message: { color: COLORS.white, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  sub: { color: COLORS.gray[200], textAlign: 'center', fontSize: 12, marginTop: 2 },
});


