import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Cosmetic } from "@interfaces/cosmetics/Cosmetic";

type Props = {
  cosmetic: Cosmetic;
  unlocked: boolean;
  equipped: boolean;
  onBuy?: () => void;
  onEquip?: () => void;
};

export default function CosmeticItem({ cosmetic, unlocked, equipped, onBuy, onEquip }: Props) {
  return (
    <View style={[styles.card, equipped && styles.equipped]}>
      <Image source={{ uri: cosmetic.imageUrl }} style={styles.image} />
      <Text style={styles.type}>{cosmetic.type}</Text>
      <Text style={styles.price}>Precio: {cosmetic.price} monedas</Text>
      {unlocked ? (
        <TouchableOpacity style={styles.button} onPress={onEquip} disabled={equipped}>
          <Text style={styles.buttonText}>{equipped ? "Equipado" : "Equipar"}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={onBuy}>
          <Text style={styles.buttonText}>Comprar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 8,
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2
  },
  equipped: {
    borderColor: "#10b981",
    borderWidth: 2
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginBottom: 8
  },
  type: {
    fontWeight: "bold",
    marginBottom: 4
  },
  price: {
    fontSize: 12,
    marginBottom: 8
  },
  button: {
    backgroundColor: "#1e40af",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold"
  }
});