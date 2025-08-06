import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { Button, Text } from "react-native";
import {
    initPaymentSheet,
    presentPaymentSheet
} from "@stripe/stripe-react-native";
import { paymentTest } from "@services/shop/paymentTest";
export default function ShopScreen() {

    const [clientSecret, setClientSecret] = useState("");


    const fetchPaymentIntent = async () => {

        const { clientSecret } = await paymentTest();
        setClientSecret(clientSecret);

        await initPaymentSheet({
            paymentIntentClientSecret: clientSecret,
            merchantDisplayName: "Mi Tienda",
        });  
    };

    const openPaymentSheet = async () => {
        const { error } = await presentPaymentSheet();

        if (error) {
            alert(`Error: ${error.message}`);
        } else {
            alert("✅ ¡Pago exitoso!");
            // OPCIONAL: notificar al backend o navegar
        }
    };
    return (
        <SafeAreaView>

            <Button title="Cargar método de pago" onPress={fetchPaymentIntent} />
            <Text>Cliente secreto: {clientSecret}</Text>
            <Button title="Pagar" onPress={openPaymentSheet} />
        </SafeAreaView>
    )
}