import { ArticleResponse } from "@interfaces/article/ArticleResponse"
import { View, Text, StyleSheet, Pressable, Image } from "react-native"
import {
    initPaymentSheet,
    presentPaymentSheet
} from "@stripe/stripe-react-native";
import { paymentItem } from "@services/shop/payment";
import { COLORS } from "@constants/colors";

const coinImage = require('../../assets/coin.png');

interface ArticleItemProps {
    data: ArticleResponse
}
export const ArticleItem = ({ data }: ArticleItemProps) => {



    const handlePurchase = async () => {
        try {
            const res = await paymentItem(data.price*100, data.id);
            
            await initPaymentSheet({
            paymentIntentClientSecret: res.clientSecret,
            merchantDisplayName: "Mi Tienda",
        });

        const { error } = await presentPaymentSheet();

        if (error) {
            alert(`Error: ${error.message}`);
        } else {
            alert("✅ ¡Pago exitoso!");
        }

        } catch (error) {
            console.error("Error during purchase:", error);
            alert("Error al procesar el pago. Por favor, inténtalo de nuevo.");
        }

        

    }


    return (
        <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={handlePurchase}>
            <View style={styles.headerRow}>
                <View style={styles.coinInfo}>
                    <Image source={coinImage} style={styles.coinIcon} resizeMode="contain" />
                    <Text style={styles.coinsText}>{data.coins}</Text>
                    <Text style={styles.coinType}>{data.typecoins}</Text>
                </View>
                <View style={styles.priceBadge}>
                    <Text style={styles.priceText}>${data.price}</Text>
                </View>
            </View>
            <Text style={styles.cta}>Toca para comprar</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.light.cardBackground,
        borderRadius: 16,
        padding: 20,
        marginVertical: 10,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: 1,
        borderColor: COLORS.black, 
    },
    cardPressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.9,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    coinInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
    },
    coinIcon: {
        width: 40,
        height: 40,
        marginRight: 12,
    },
    coinsText: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.primary,
        marginRight: 6,
    },
    coinType: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.light.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    priceBadge: {
        backgroundColor: COLORS.primary,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 30,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    priceText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    cta: {
        marginTop: 14,
        fontSize: 12,
        color: COLORS.light.textSecondary,
        letterSpacing: 0.5,
    },
});