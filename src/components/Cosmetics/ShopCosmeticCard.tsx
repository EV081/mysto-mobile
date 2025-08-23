import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Cosmetic } from "@interfaces/cosmetics/Cosmetic";
import { CosmeticType } from "@interfaces/cosmetics/CosmeticType";

const coinImage = require("../../../assets/coin.png");

type Props = {
  cosmetic: Cosmetic;
  onBuy: () => void;
};

function getImageStyle(type: CosmeticType) {
  switch (type) {
    case CosmeticType.CABEZA:
      return { ...styles.image, marginTop: 14, marginBottom: 2, height: 80, width: 80 };
    case CosmeticType.PANTALONES:
      return { ...styles.image, marginTop: -10, marginBottom: 16, height: 80, width: 80 };
    case CosmeticType.CUERPO:
    default:
      return { ...styles.image, height: 80, width: 80 };
  }
}

export default function ShopCosmeticCard({ cosmetic, onBuy }: Props) {
  const imgStyle = getImageStyle(cosmetic.type);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{cosmetic.name}</Text>
        <Text style={styles.type}>{cosmetic.type}</Text>
      </View>
      <Image source={{ uri: cosmetic.imageUrl }} style={imgStyle} />
      <View style={styles.priceRow}>
        <Image source={coinImage} style={styles.coinIcon} />
        <Text style={styles.price}>{cosmetic.price}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={onBuy}>
        <Text style={styles.buttonText}>Comprar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    margin: 8,
    width: 140,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  header: {
    width: "100%",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#1e293b",
    marginBottom: 2,
    textAlign: "center",
  },
  type: {
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
    marginBottom: 8,
  },
  image: {
    height: 80,
    width: 80,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
    resizeMode: "contain",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  coinIcon: {
    width: 22,
    height: 22,
    marginRight: 2,
  },
  price: {
    fontSize: 16,
    color: "#1e40af",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#1e40af",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 6,
    marginTop: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});