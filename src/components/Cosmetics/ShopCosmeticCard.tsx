import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Cosmetic } from "@interfaces/cosmetics/Cosmetic";
import { CosmeticType } from "@interfaces/cosmetics/CosmeticType";
import { COLORS } from '@constants/colors';

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
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
  {cosmetic.name}
</Text>

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
    height: 250,  
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderColor: COLORS.black, 
    borderWidth: 1,   
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
    color: COLORS.primary,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: COLORS.primary,
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