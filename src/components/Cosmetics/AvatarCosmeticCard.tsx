import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Cosmetic } from "@interfaces/cosmetics/Cosmetic";

type Props = {
  cosmetic: Cosmetic;
  equipped: boolean;
  onEquip: () => void;
};

export default function AvatarCosmeticCard({ cosmetic, equipped, onEquip }: Props) {
  return (
    <View style={[styles.card, equipped && styles.equipped]}>
      <Image source={{ uri: cosmetic.imageUrl }} style={styles.image} />
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
  },
  equipped: {
    borderColor: "#10b981",
    borderWidth: 2,
  },
  image: {
    width: 56,
    height: 56,
    marginBottom: 6,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  name: {
    fontWeight: "bold",
    fontSize: 13,
    color: "#1e293b",
    marginBottom: 5,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#1e40af",
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