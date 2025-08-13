import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { COLORS } from '@constants/colors';
import { CulturalObjectType } from '@interfaces/cuturalObject/CulturalObjectType';

interface TypeSelectorProps {
  selectedType: CulturalObjectType | null;
  onTypeChange: (type: CulturalObjectType) => void;
}

const OBJECT_TYPES = [
  { label: 'Cerámicas', value: CulturalObjectType.CERAMICS, icon: '🍶' },
  { label: 'Pintura', value: CulturalObjectType.PAINTING, icon: '🎨' },
  { label: 'Textiles', value: CulturalObjectType.TEXTILES, icon: '🧵' },
  { label: 'Joyería', value: CulturalObjectType.GOLDSMITHING, icon: '💎' },
];

export default function TypeSelector({
  selectedType,
  onTypeChange,
}: TypeSelectorProps) {
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);

  const selectedTypeData = OBJECT_TYPES.find(o => o.value === selectedType);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tipo de objeto cultural *</Text>
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            selectedType && styles.dropdownButtonSelected
          ]}
          onPress={() => setTypeMenuVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.dropdownButtonText,
            selectedType && styles.dropdownButtonTextSelected
          ]}>
            {selectedTypeData ? `${selectedTypeData.icon} ${selectedTypeData.label}` : 'Selecciona tipo'}
          </Text>
          <IconButton
            icon={typeMenuVisible ? 'chevron-up' : 'chevron-down'}
            size={20}
            iconColor={COLORS.primary}
          />
        </TouchableOpacity>
        
        <Modal
          visible={typeMenuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setTypeMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setTypeMenuVisible(false)}
          >
            <View style={styles.modalContent}>
              {OBJECT_TYPES.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalItem,
                    selectedType === option.value && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    onTypeChange(option.value as CulturalObjectType);
                    setTypeMenuVisible(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    selectedType === option.value && styles.modalItemTextSelected
                  ]}>
                    {option.icon} {option.label}
                  </Text>
                  {selectedType === option.value && (
                    <IconButton
                      icon="check"
                      size={20}
                      iconColor={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
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
  dropdownContainer: {
    position: 'relative',
    zIndex: 9999,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  dropdownButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#f0f9ff',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#6b7280',
    flex: 1,
  },
  dropdownButtonTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  modalItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
}); 