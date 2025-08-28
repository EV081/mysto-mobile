import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Cosmetic } from "@interfaces/cosmetics/Cosmetic";
import { CosmeticType } from "@interfaces/cosmetics/CosmeticType";
import { COLORS } from '@constants/colors';

type Props = {
  cosmetic: Cosmetic;
  equipped: boolean;
  onEquip: () => void;
};

function getImageStyle(type: CosmeticType) {
  // Ajuste de posición y tamaño por tipo
  switch (type) {
    case CosmeticType.CABEZA:
      return { ...styles.image, marginTop: 12, marginBottom: 2, height: 80, width: 80 };
    case CosmeticType.PANTALONES:
      return { ...styles.image, marginTop: -10, marginBottom: 16, height: 80, width: 80 };
    case CosmeticType.CUERPO:
    default:
      return { ...styles.image, height: 80, width: 80 };
  }
}

export default function AvatarCosmeticCard({ cosmetic, equipped, onEquip }: Props) {
  const imgStyle = getImageStyle(cosmetic.type);

  return (
    <View style={[styles.card, equipped && styles.equipped]}>
      <Image source={{ uri: cosmetic.imageUrl }} style={imgStyle} />
      <Text style={styles.name}>{cosmetic.name}</Text>
      <TouchableOpacity
        style={[styles.button, equipped && styles.buttonDesequip]}
        onPress={onEquip}
      >
        <Text style={styles.buttonText}>{equipped ? "Desequipar" : "Equipar"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    margin: 8,
    width: 120,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    borderColor: COLORS.black, 
    borderWidth: 1,   
  },
  equipped: {
    borderColor: "#10b981",
    borderWidth: 2,
  },
  image: {
    height: 80,
    width: 80,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
    resizeMode: "contain",
  },
  name: {
    fontWeight: "bold",
    fontSize: 13,
    color: "#1e293b",
    marginBottom: 5,
    textAlign: "center",
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 5,
    marginTop: 2,
  },
  buttonDesequip: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 5,
    marginTop: 2,
  },
  buttonDisabled: {
    backgroundColor: "#cbd5e1",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
});