import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { COLORS } from '@constants/colors';

interface HourPickerProps {
  visible: boolean;
  onClose: () => void;
  onTimeSelect: (time: string) => void;
  currentTime?: string;
  title: string;
}

export default function HourPicker({
  visible,
  onClose,
  onTimeSelect,
  currentTime = '06:00',
  title,
}: HourPickerProps) {
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  // Parse currentTime (ej. "18:30") y establece estados
  useEffect(() => {
    if (visible && currentTime) {
      const [hourStr, minuteStr] = currentTime.split(':');
      let hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr ?? '0', 10);
      let period: 'AM' | 'PM' = 'AM';

      if (hour >= 12) {
        period = 'PM';
        if (hour > 12) hour -= 12;
      } else if (hour === 0) {
        hour = 12;
      }

      setSelectedHour(hour);
      setSelectedMinute(minute);
      setSelectedPeriod(period);
    }
  }, [visible, currentTime]);

  const handleConfirm = () => {
    // Si el usuario solo selecciona hora y no minuto, se autocompleta como 00
    const minute = selectedMinute ?? 0;

    // Convertimos a formato 24h
    const hour24 =
      selectedPeriod === 'PM' && selectedHour !== 12
        ? selectedHour + 12
        : selectedPeriod === 'AM' && selectedHour === 12
        ? 0
        : selectedHour;

    const timeString = `${hour24.toString().padStart(2, '0')}:${minute
      .toString()
      .padStart(2, '0')}`;

    onTimeSelect(timeString);
    onClose();
  };

  const renderWheelItems = (
    items: number[],
    selectedValue: number,
    onSelect: (value: number) => void
  ) => {
    const extendedItems = [...items, ...items, ...items];
    const startIndex = items.length;

    return (
      <View style={styles.wheelWrapper}>
        <View style={styles.wheelSelectionIndicator} />
        <ScrollView
          style={styles.wheelScrollView}
          showsVerticalScrollIndicator={false}
          snapToInterval={40}
          decelerationRate="fast"
          onMomentumScrollEnd={(event) => {
            const y = event.nativeEvent.contentOffset.y;
            const index = Math.round(y / 40);
            const actualIndex = (index + startIndex) % items.length;
            onSelect(items[actualIndex]);
          }}
          contentContainerStyle={styles.wheelScrollContent}
          bounces={false}
        >
          {extendedItems.map((item, index) => (
            <View key={`item-${index}`} style={styles.wheelItemContainer}>
              <Text
                style={[
                  styles.wheelItemText,
                  item === selectedValue && styles.wheelItemTextSelected,
                ]}
              >
                {item.toString().padStart(2, '0')}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.timePickerOverlay}>
        <View style={styles.timePickerContainer}>
          <View style={styles.timePickerHeader}>
            <Text style={styles.timePickerTitle}>{title}</Text>
            <IconButton icon="close" size={24} onPress={onClose} />
          </View>

          <View style={styles.timePickerContent}>
            {/* Hours */}
            <View style={styles.timeColumn}>
              <Text style={styles.timeColumnLabel}>Hora</Text>
              <View style={styles.wheelContainer}>
                {renderWheelItems(hours, selectedHour, setSelectedHour)}
              </View>
            </View>

            {/* Minutes */}
            <View style={styles.timeColumn}>
              <Text style={styles.timeColumnLabel}>Minuto</Text>
              <View style={styles.wheelContainer}>
                {renderWheelItems(minutes, selectedMinute, setSelectedMinute)}
              </View>
            </View>

            {/* Period */}
            <View style={styles.timeColumn}>
              <Text style={styles.timeColumnLabel}>Periodo</Text>
              <View style={styles.periodContainer}>
                <TouchableOpacity
                  style={[
                    styles.periodOption,
                    selectedPeriod === 'AM' && styles.periodOptionSelected,
                  ]}
                  onPress={() => setSelectedPeriod('AM')}
                >
                  <Text
                    style={[
                      styles.periodOptionText,
                      selectedPeriod === 'AM' && styles.periodOptionTextSelected,
                    ]}
                  >
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.periodOption,
                    selectedPeriod === 'PM' && styles.periodOptionSelected,
                  ]}
                  onPress={() => setSelectedPeriod('PM')}
                >
                  <Text
                    style={[
                      styles.periodOptionText,
                      selectedPeriod === 'PM' && styles.periodOptionTextSelected,
                    ]}
                  >
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.timePickerActions}>
            <Button mode="outlined" onPress={onClose} style={styles.timePickerButton}>
              Cancelar
            </Button>
            <Button mode="contained" onPress={handleConfirm} style={styles.timePickerButton}>
              Confirmar
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  timePickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  timePickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '80%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  timePickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  timeColumn: {
    alignItems: 'center',
  },
  timeColumnLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  periodContainer: {
    flexDirection: 'column',
    marginTop: 10,
    gap: 8,
    height: 120,
    justifyContent: 'center',
  },
  periodOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  periodOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  periodOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  timePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  timePickerButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  wheelWrapper: {
    width: 100,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wheelSelectionIndicator: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(115, 0, 191, 0.1)',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.primary,
    zIndex: 1,
    transform: [{ translateY: -20 }],
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  wheelScrollView: {
    width: 100,
    height: 120,
  },
  wheelScrollContent: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingTop: 40,
    paddingBottom: 40,
  },
  wheelItemContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 40,
  },
  wheelItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    opacity: 0.7,
  },
  wheelItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 18,
    opacity: 1,
  },
  wheelContainer: {
    width: 100,
    height: 120,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    overflow: 'hidden',
  },
}); 