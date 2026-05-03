import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Animated, Easing, TouchableWithoutFeedback, Vibration
} from 'react-native';

export default function ConfirmationModal({
  visible,
  title,
  message,
  icon = '⚠️',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = '#E06B12', // Orange theme
  onConfirm,
  onCancel,
  dismissible = true,
  critical = false // If critical is true, cannot be dismissed by tapping outside
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  if (!visible && fadeAnim._value === 0) return null;

  const handleConfirm = () => {
    Vibration.vibrate(40); // Haptic feedback
    if (onConfirm) onConfirm();
  };

  const handleBackdropPress = () => {
    if (dismissible && !critical && onCancel) {
      onCancel();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleBackdropPress}>
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.modalBox, { transform: [{ scale: scaleAnim }] }]}>
              
              <View style={[styles.iconWrap, { backgroundColor: confirmColor + '1A' }]}>
                <Text style={styles.icon}>{icon}</Text>
              </View>
              
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
                  <Text style={styles.cancelTxt}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmBtn, { backgroundColor: confirmColor }]} 
                  onPress={handleConfirm} 
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmTxt}>{confirmText}</Text>
                </TouchableOpacity>
              </View>

            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Dark overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelTxt: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTxt: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
