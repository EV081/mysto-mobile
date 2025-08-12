import { ArticleResponse } from "@interfaces/article/ArticleResponse"
import { View, Text, StyleSheet, Button } from "react-native"
import { useState } from "react"
import {
    initPaymentSheet,
    presentPaymentSheet
} from "@stripe/stripe-react-native";
import { paymentItem } from "@services/shop/payment";

interface ArticleItemProps {
    data: ArticleResponse
}
export const ArticleItem = ({ data }: ArticleItemProps) => {

    const [clientSecret, setClientSecret] = useState("");

    const handlePurchase = async () => {
        try {
            const res = await paymentItem(data.price*100, data.id);
            setClientSecret(res.clientSecret);


        } catch (error) {
            console.error("Error during purchase:", error);
            alert("Error al procesar el pago. Por favor, inténtalo de nuevo.");
        }

        await initPaymentSheet({
            paymentIntentClientSecret: clientSecret,
            merchantDisplayName: "Mi Tienda",
        });

        const { error } = await presentPaymentSheet();

        if (error) {
            alert(`Error: ${error.message}`);
        } else {
            alert("✅ ¡Pago exitoso!");
        }

    }


    return (
        <View style={styles.container}>
            <Text style={styles.text}>{data.coins}</Text>
            <Text style={styles.text}>{data.typecoins}</Text>
            <Text style={styles.price}>{data.price}</Text>
            <Button
                title="Comprar"
                onPress={handlePurchase}
                disabled={!clientSecret}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    text: {
        fontSize: 16,
        color: '#333333',
        marginBottom: 4,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginTop: 8,
    }
});