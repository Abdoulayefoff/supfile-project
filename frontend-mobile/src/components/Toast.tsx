import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ToastProps {
  visible: boolean;
  message: string;
  subMessage?: string;
  type?: 'success' | 'error' | 'info';
  onHide: () => void;
  duration?: number;
}

const { width } = Dimensions.get('window');

export default function Toast({ visible, message, subMessage, type = 'success', onHide, duration = 3000 }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const getConfig = () => {
    switch (type) {
      case 'success': return { bg: '#10b981', icon: 'checkmark-circle' as const, iconColor: '#fff' };
      case 'error': return { bg: '#ef4444', icon: 'close-circle' as const, iconColor: '#fff' };
      case 'info': return { bg: '#1A56DB', icon: 'information-circle' as const, iconColor: '#fff' };
    }
  };

  const config = getConfig();

  return (
    <Animated.View style={[
      styles.container,
      { transform: [{ translateY }], opacity, backgroundColor: config.bg }
    ]}>
      <View style={styles.iconBox}>
        <Ionicons name={config.icon} size={22} color={config.iconColor} />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.message} numberOfLines={1}>{message}</Text>
        {subMessage && (
          <Text style={styles.subMessage} numberOfLines={2}>{subMessage}</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  textBox: { flex: 1 },
  message: { fontSize: 14, fontWeight: '700', color: '#fff' },
  subMessage: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
});