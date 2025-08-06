export interface PaymentResponse {
    clientSecret: string;
    error?: string;
    message?: string;
    status?: string;
    paymentMethodId?: string;
    paymentIntentId?: string;
}