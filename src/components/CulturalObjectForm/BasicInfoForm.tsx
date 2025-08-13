import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { COLORS } from '@constants/colors';

interface BasicInfoFormProps {
  name: string;
  points: number;
  coins: number;
  description: string;
  onNameChange: (name: string) => void;
  onPointsChange: (points: number) => void;
  onCoinsChange: (coins: number) => void;
  onDescriptionChange: (description: string) => void;
}

export default function BasicInfoForm({
  name,
  points,
  coins,
  description,
  onNameChange,
  onPointsChange,
  onCoinsChange,
  onDescriptionChange,
}: BasicInfoFormProps) {
  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre del objeto *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Vasija ceremonial"
          value={name}
          onChangeText={onNameChange}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Puntos ofrecidos *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 100 puntos"
          value={points.toString()}
          onChangeText={(val) => onPointsChange(Number(val))}
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Monedas ofrecidas *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 50 monedas"
          value={coins.toString()}
          onChangeText={(val) => onCoinsChange(Number(val))}
          keyboardType="numeric"
          maxLength={10}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Descripción *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe el objeto cultural..."
          value={description}
          onChangeText={onDescriptionChange}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});
