import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { COLORS } from '@constants/colors';

interface GeneralInfoFormProps {
  name: string;
  description: string;
  latitud: string;
  longitud: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onLatitudChange: (latitud: string) => void;
  onLongitudChange: (longitud: string) => void;
}

export default function GeneralInfoForm({
  name,
  description,
  latitud,
  longitud,
  onNameChange,
  onDescriptionChange,
  onLatitudChange,
  onLongitudChange,
}: GeneralInfoFormProps) {
  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre del museo *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Museo de Arte Moderno"
          value={name}
          onChangeText={onNameChange}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Descripción *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe el museo..."
          value={description}
          onChangeText={onDescriptionChange}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
      </View>

      <View style={styles.coordinatesContainer}>
        <View style={styles.coordinateInput}>
          <Text style={styles.label}>Latitud *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: -12.0464"
            value={latitud}
            onChangeText={onLatitudChange}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>
        <View style={styles.coordinateInput}>
          <Text style={styles.label}>Longitud *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: -77.0428"
            value={longitud}
            onChangeText={onLongitudChange}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>
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
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#000000',
    minHeight: 50,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  coordinatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
  },
}); 