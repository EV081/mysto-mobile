import Api from "@services/api";
import { PaymentRequest } from "@interfaces/shop/PaymentRequest";
import { PaymentResponse } from "@interfaces/shop/PaymentResponse";



export const paymentItem = async (amount: number, articleId: number) => {
    const api = Api.getInstance();
    try {
        const response = await (await api).post<PaymentRequest, PaymentResponse>({ amount, articleId }, { url: "/api/payment/create-intent" });
        return response.data;
    } catch (error) {
        console.error("Payment test failed:", error);
        throw error;
    }
};