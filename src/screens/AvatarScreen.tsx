import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, FlatList } from "react-native";
import AvatarLayers from "@components/Avatar/AvatarLayers";
import AvatarCosmeticCard from "@components/Cosmetics/AvatarCosmeticCard";
import { getUnlockedCosmetics } from "@services/cosmetics/getUnlockedCosmetics";
import { getEquippedCosmetics } from "@services/cosmetics/getEquippedCosmetics";
import { equipCosmetic } from "@services/cosmetics/equipCosmetic";
import { unequipCosmetic } from "@services/cosmetics/unequipCosmetic";
import { Cosmetic } from "@interfaces/cosmetics/Cosmetic";
import { CosmeticType } from "@interfaces/cosmetics/CosmeticType";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "@constants/colors";

const TYPE_LABELS: Record<CosmeticType, string> = {
  CABEZA: "Cabezas",
  CUERPO: "Cuerpos",
  PANTALONES: "Pantalones",
};

export default function AvatarScreen() {
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);
  const [equipped, setEquipped] = useState<{ head?: Cosmetic; body?: Cosmetic; pants?: Cosmetic }>({});
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<CosmeticType>(CosmeticType.CABEZA);

  const fetchCosmeticsAndEquipped = useCallback(async () => {
    setLoading(true);
    try {
      const unlocked = await getUnlockedCosmetics();
      const equippedRes = await getEquippedCosmetics();
      setCosmetics(unlocked);
      setEquipped(equippedRes);
    } catch (err) {
      Alert.alert("Error", "No se pudieron cargar los cosméticos");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCosmeticsAndEquipped();
    }, [fetchCosmeticsAndEquipped])
  );

  const handleEquip = async (cosmetic: Cosmetic) => {
    try {
      const isEquipped = equippedIdForType === cosmetic.id;
      if (isEquipped) {
        await unequipCosmetic(cosmetic.id);
        await fetchCosmeticsAndEquipped();
        Alert.alert("Cosmético desequipado");
      } else {
        await equipCosmetic(cosmetic.id);
        await fetchCosmeticsAndEquipped();
        Alert.alert("¡Cosmético equipado!");
      }
    } catch {
      Alert.alert("Error", "No se pudo modificar el cosmético");
    }
  };

  const filteredCosmetics = cosmetics.filter(cos => cos.type === selectedType);
  const equippedIdForType =
    selectedType === CosmeticType.CABEZA
      ? equipped.head?.id
      : selectedType === CosmeticType.CUERPO
      ? equipped.body?.id
      : equipped.pants?.id;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu Avatar</Text>
      <AvatarLayers equipped={equipped} />
      <View style={styles.typeSelector}>
        {Object.values(CosmeticType).map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              selectedType === type && styles.typeButtonSelected
            ]}
            onPress={() => setSelectedType(type)}
          >
            <Text
              style={[
                styles.typeButtonText,
                selectedType === type && styles.typeButtonTextSelected
              ]}
            >
              {TYPE_LABELS[type]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.subtitle}>
        {TYPE_LABELS[selectedType]} desbloqueados
      </Text>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={filteredCosmetics}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <AvatarCosmeticCard
              cosmetic={item}
              equipped={equippedIdForType === item.id}
              onEquip={() => handleEquip(item)}
            />
          )}
          horizontal
          contentContainerStyle={styles.avatarListContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No tienes cosméticos de este tipo.</Text>}
          showsHorizontalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 16,
    gap: 12,
    width: "100%",
  },
  typeButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#cfcfcfff",
    marginHorizontal: 4,
    borderColor: COLORS.black, 
    borderWidth: 1,   
  },
  typeButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.black, 
    borderWidth: 1,   
  },
  typeButtonText: {
    fontSize: 16,
    color: "#334155",
  },
  typeButtonTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 8,
    textAlign: "center",
  },
  avatarListContent: {
    paddingVertical: 8,
    minHeight: 120,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginTop: 24,
  },
});