import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import TimeInput from './TimeInput';

interface TimeSelectorProps {
  openTime: string;
  closeTime: string;
  onOpenTimeChange: (time: string) => void;
  onCloseTimeChange: (time: string) => void;
}

export default function TimeSelector({
  openTime,
  closeTime,
  onOpenTimeChange,
  onCloseTimeChange,
}: TimeSelectorProps) {
  return (
    <View style={styles.container}>
      <TimeInput
        value={openTime}
        onTimeChange={onOpenTimeChange}
        label="Hora de apertura"
        placeholder="09:00"
      />

      <TimeInput
        value={closeTime}
        onTimeChange={onCloseTimeChange}
        label="Hora de cierre"
        placeholder="18:00"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
}); 