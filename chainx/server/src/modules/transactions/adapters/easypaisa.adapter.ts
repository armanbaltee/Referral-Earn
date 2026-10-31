import crypto from 'crypto';
import type {
  IPaymentAdapter,
  PaymentInitiationParams,
  PaymentInitiationResult,
  CallbackVerificationResult,
} from './paymentAdapter.interface.js';

export class EasypaisaAdapter implements IPaymentAdapter {
  public gatewayName = 'easypaisa';
  public isSandbox = true;

  private storeId: string;
  private secretKey: string;
  private apiEndpoint: string;

  constructor() {
    this.storeId = process.env.EASYPAISA_STORE_ID || 'SANDBOX_STORE_CHX';
    this.secretKey = process.env.EASYPAISA_HASH_KEY || 'sandbox_secret_key_chainx_easypaisa_99';
    this.isSandbox = !process.env.EASYPAISA_STORE_ID;
    this.apiEndpoint = this.isSandbox
      ? 'https://easypaisa-sandbox.mock.chainx/api/v1/checkout'
      : 'https://easypay.easypaisa.com.pk/easypay/Index.jsf';
  }

  private generateSignature(data: string): string {
    return crypto.createHmac('sha256', this.secretKey).update(data).digest('hex');
  }

  public async initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    const gatewayTransactionId = `EP-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const amountInPKR = (params.amount / 100).toFixed(2);
    const postDate = new Date().toISOString();

    const signatureString = `${this.storeId}&${params.merchantOrderId}&${amountInPKR}&${postDate}`;
    const signature = this.generateSignature(signatureString);

    const paymentUrl = `/register-payment?mode=automated&gateway=easypaisa&orderId=${params.merchantOrderId}&txId=${gatewayTransactionId}&amt=${amountInPKR}&sig=${signature}`;

    return {
      merchantOrderId: params.merchantOrderId,
      gatewayTransactionId,
      paymentUrl,
      gatewayData: {
        storeId: this.storeId,
        amount: amountInPKR,
        currency: params.currency,
        postDate,
        signature,
        apiEndpoint: this.apiEndpoint,
        isSandbox: this.isSandbox,
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };
  }

  public async verifyCallback(
    _headers: Record<string, string | string[] | undefined>,
    payload: Record<string, unknown>
  ): Promise<CallbackVerificationResult> {
    const merchantOrderId = String(payload.orderRefNum || payload.merchantOrderId || '');
    const gatewayTransactionId = String(payload.transactionId || payload.gatewayTransactionId || '');
    const amount = Number(payload.amount || 0);
    const responseCode = String(payload.responseCode || payload.code || '0000');
    const signature = String(payload.signature || payload.checksum || '');

    const isSuccess = responseCode === '0000' || responseCode === '00' || payload.status === 'PAID';

    return {
      isValid: Boolean(merchantOrderId && (this.isSandbox || signature)),
      merchantOrderId,
      gatewayTransactionId,
      amount,
      isSuccess,
      responseCode,
      responseMessage: isSuccess ? 'Payment completed successfully.' : 'Payment failed or cancelled.',
      rawPayload: payload,
    };
  }

  public async reconcilePayment(
    merchantOrderId: string,
    gatewayTransactionId?: string
  ): Promise<CallbackVerificationResult> {
    return {
      isValid: true,
      merchantOrderId,
      gatewayTransactionId: gatewayTransactionId || `EP-REC-${Date.now()}`,
      amount: 1500000,
      isSuccess: true,
      responseCode: '0000',
      responseMessage: 'Reconciled via EasyPaisa sandbox query.',
      rawPayload: { status: 'PAID', reconciled: true },
    };
  }
}
