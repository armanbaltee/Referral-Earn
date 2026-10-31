export interface PaymentInitiationParams {
  merchantOrderId: string;
  amount: number; // in paisa
  currency: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  description: string;
  callbackUrl: string;
  returnUrl: string;
}

export interface PaymentInitiationResult {
  merchantOrderId: string;
  gatewayTransactionId: string;
  paymentUrl: string;
  gatewayData: Record<string, unknown>;
  expiresAt: Date;
}

export interface CallbackVerificationResult {
  isValid: boolean;
  merchantOrderId: string;
  gatewayTransactionId: string;
  amount: number;
  isSuccess: boolean;
  responseCode: string;
  responseMessage: string;
  rawPayload: Record<string, unknown>;
}

export interface IPaymentAdapter {
  gatewayName: string;
  isSandbox: boolean;
  initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult>;
  verifyCallback(
    headers: Record<string, string | string[] | undefined>,
    payload: Record<string, unknown>
  ): Promise<CallbackVerificationResult>;
  reconcilePayment(
    merchantOrderId: string,
    gatewayTransactionId?: string
  ): Promise<CallbackVerificationResult>;
}
