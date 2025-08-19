import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
  Dimensions
} from 'react-native';
import { getThemeColors, COLORS } from '@constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

interface LogoutConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const isDark = colorScheme === 'dark';

  const handleCancel = () => {
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={styles.fullScreenOverlay}>
        <View style={styles.centeredView}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
              <Text style={styles.icon}>🚪</Text>
              <Text style={[styles.title, { color: colors.text }]}>
                Cerrar Sesión
              </Text>
            </View>
            
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              ¿Estás seguro de que deseas cerrar sesión?
            </Text>
            
            <View style={styles.buttonsContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.button, 
                  styles.cancelButton, 
                  { 
                    backgroundColor: isDark ? 'rgba(156, 163, 175, 0.2)' : 'rgba(156, 163, 175, 0.1)',
                    borderColor: colors.textSecondary,
                    opacity: pressed ? 0.7 : 1,
                  }
                ]}
                onPressOut={handleCancel}
                hitSlop={10}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                  Cancelar
                </Text>
              </Pressable>
              
              <Pressable
                style={({ pressed }) => [
                  styles.button, 
                  styles.confirmButton,
                  { opacity: pressed ? 0.7 : 1 }
                ]}
                onPressOut={handleConfirm}
                hitSlop={10}
              >
                <Text style={styles.confirmButtonText}>
                  Cerrar Sesión
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.tempCloseButton}
              onPress={() => {
                console.log('❌ TEMP CLOSE BUTTON PRESSED');
                handleCancel();
              }}
            >
              <Text style={styles.tempCloseText}>✕ Cerrar (Temporal)</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredView: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    width: '100%',
    height: '100%',
  },
  modalContent: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: COLORS.button.danger,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.input.background,
  },
  tempCloseButton: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
  },
  tempCloseText: {
    color: 'white',
    fontSize: 12,
  },
});

export default LogoutConfirmationModal;