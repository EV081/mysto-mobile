import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { Cosmetic } from "@interfaces/cosmetics/Cosmetic";

type Props = {
  equipped: {
    head?: Cosmetic;
    body?: Cosmetic;
    pants?: Cosmetic;
  };
};

export default function AvatarLayers({ equipped }: Props) {
  const base = require("assets/base.png"); 

  return (
    <View style={styles.avatarContainer}>
      <Image source={base} style={styles.layer} />
      {equipped.head && <Image source={{ uri: equipped.head.imageUrl }} style={styles.layer} />}
      {equipped.body && <Image source={{ uri: equipped.body.imageUrl }} style={styles.layer} />}
      {equipped.pants && <Image source={{ uri: equipped.pants.imageUrl }} style={styles.layer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    width: 160,
    height: 240,
    position: "relative",
    alignItems: "center",
    justifyContent: "center"
  },
  layer: {
    width: 160,
    height: 240,
    position: "absolute",
    top: 0,
    left: 0
  }
});