import Api from "@services/api";
import { PaymentRequest } from "@interfaces/shop/PaymentRequest";
import { PaymentResponse } from "@interfaces/shop/PaymentResponse";

export const paymentTest = async () => {
    const api = Api.getInstance();
    try {
        const response = await (await api).post<PaymentRequest, PaymentResponse>({ amount: 2000, articleId: 1 }, { url: "/api/payment/create-intent" });
        return response.data;
    } catch (error) {
        console.error("Payment test failed:", error);
        throw error;
    }
};

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