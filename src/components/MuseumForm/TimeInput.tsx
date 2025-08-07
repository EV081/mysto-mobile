import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { COLORS } from '@constants/colors';

interface TimeInputProps {
  value: string; 
  onTimeChange: (time: string) => void;
  label: string;
  placeholder?: string;
}

export default function TimeInput({
  value,
  onTimeChange,
  label,
  placeholder = "00:00"
}: TimeInputProps) {
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      const intH = parseInt(h);
      setMinute(m.padStart(2, '0'));

      if (intH >= 12) {
        setPeriod('PM');
        setHour((intH === 12 ? 12 : intH - 12).toString());
      } else {
        setPeriod('AM');
        setHour((intH === 0 ? 12 : intH).toString());
      }
    }
  }, [value]);

  const formatAndSendTime = (h: string, m: string, p: 'AM' | 'PM') => {
    let intHour = parseInt(h || '0');
    let intMinute = parseInt(m || '00');

    if (isNaN(intHour)) intHour = 0;
    if (isNaN(intMinute)) intMinute = 0;

    // Validar rangos
    if (intHour > 12) intHour = 12;
    if (intMinute > 59) intMinute = 59;

    let finalHour = intHour;
    if (p === 'PM' && intHour < 12) finalHour += 12;
    if (p === 'AM' && intHour === 12) finalHour = 0;

    const formatted = `${finalHour.toString().padStart(2, '0')}:${intMinute
      .toString()
      .padStart(2, '0')}:00`;
    onTimeChange(formatted);
  };

  const handleHourChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setHour(cleaned);
  };

  const handleMinuteChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const fixedMinute = cleaned === '' ? '00' : cleaned;
    setMinute(fixedMinute);
  };

  const handlePeriodChange = (p: 'AM' | 'PM') => {
    setPeriod(p);
    formatAndSendTime(hour, minute, p);
    setShowPeriodPicker(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label} *</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={hour}
          placeholder="HH"
          onChangeText={handleHourChange}
          onBlur={() => formatAndSendTime(hour, minute, period)} // << agrega esto
          keyboardType="numeric"
          maxLength={2}
        />
        <Text style={styles.colon}>:</Text>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={minute}
          placeholder="MM"
          onChangeText={handleMinuteChange}
          onBlur={() => formatAndSendTime(hour, minute, period)} // << agrega esto
          keyboardType="numeric"
          maxLength={2}
        />
        <TouchableOpacity
          style={styles.periodButton}
          onPress={() => setShowPeriodPicker(true)}
        >
          <Text style={styles.periodText}>{period}</Text>
          <IconButton icon="chevron-down" size={16} iconColor={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Modal de selección AM/PM */}
      <Modal
        visible={showPeriodPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPeriodPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar periodo</Text>
            <View style={styles.periodContainer}>
              {['AM', 'PM'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.periodOption,
                    period === p && styles.periodOptionSelected,
                  ]}
                  onPress={() => handlePeriodChange(p as 'AM' | 'PM')}
                >
                  <Text
                    style={[
                      styles.periodOptionText,
                      period === p && styles.periodOptionTextSelected,
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#000000',
    textAlign: 'center',
    minHeight: 50,
  },
  colon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    paddingHorizontal: 4,
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    minHeight: 50,
  },
  periodText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 250,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  periodContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  periodOption: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  periodOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodOptionText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  periodOptionTextSelected: {
    color: '#ffffff',
  },
});
