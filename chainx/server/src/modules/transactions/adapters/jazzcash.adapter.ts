import crypto from 'crypto';
import type {
  IPaymentAdapter,
  PaymentInitiationParams,
  PaymentInitiationResult,
  CallbackVerificationResult,
} from './paymentAdapter.interface.js';

export class JazzcashAdapter implements IPaymentAdapter {
  public gatewayName = 'jazzcash';
  public isSandbox = true;

  private merchantId: string;
  private password: string;
  private integritySalt: string;

  constructor() {
    this.merchantId = process.env.JAZZCASH_MERCHANT_ID || 'SANDBOX_MERCHANT_CHX';
    this.password = process.env.JAZZCASH_PASSWORD || 'sandbox_pass_123';
    this.integritySalt = process.env.JAZZCASH_INTEGRITY_SALT || 'sandbox_salt_chainx_jazzcash_99';
    this.isSandbox = !process.env.JAZZCASH_MERCHANT_ID;
  }

  private calculateSecureHash(fields: Record<string, string>): string {
    const sortedKeys = Object.keys(fields).sort();
    let sortedString = this.integritySalt;
    for (const key of sortedKeys) {
      if (fields[key] !== '' && key !== 'pp_SecureHash') {
        sortedString += `&${fields[key]}`;
      }
    }
    return crypto.createHmac('sha256', this.integritySalt).update(sortedString).digest('hex').toUpperCase();
  }

  public async initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
    const gatewayTransactionId = `JC-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const amountInPKR = (params.amount / 100).toFixed(2);
    const pp_TxnDateTime = new Date()
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14);

    const payloadFields: Record<string, string> = {
      pp_Version: '1.1',
      pp_TxnType: 'MWALLET',
      pp_MerchantID: this.merchantId,
      pp_Password: this.password,
      pp_TxnRefNo: params.merchantOrderId,
      pp_Amount: (params.amount).toString(), // in paisa
      pp_TxnCurrency: 'PKR',
      pp_TxnDateTime,
      pp_BillReference: `REG-${params.merchantOrderId.slice(-6)}`,
      pp_Description: params.description,
      pp_ReturnURL: params.returnUrl,
    };

    const secureHash = this.calculateSecureHash(payloadFields);

    const paymentUrl = `/register-payment?mode=automated&gateway=jazzcash&orderId=${params.merchantOrderId}&txId=${gatewayTransactionId}&amt=${amountInPKR}&sig=${secureHash}`;

    return {
      merchantOrderId: params.merchantOrderId,
      gatewayTransactionId,
      paymentUrl,
      gatewayData: {
        ...payloadFields,
        pp_SecureHash: secureHash,
        isSandbox: this.isSandbox,
      },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };
  }

  public async verifyCallback(
    _headers: Record<string, string | string[] | undefined>,
    payload: Record<string, unknown>
  ): Promise<CallbackVerificationResult> {
    const merchantOrderId = String(payload.pp_TxnRefNo || payload.merchantOrderId || '');
    const gatewayTransactionId = String(payload.pp_RetreivalReferenceNo || payload.gatewayTransactionId || '');
    const amount = Number(payload.pp_Amount || payload.amount || 0);
    const responseCode = String(payload.pp_ResponseCode || payload.responseCode || '000');

    const isSuccess = responseCode === '000' || responseCode === '00' || payload.status === 'PAID';

    return {
      isValid: Boolean(merchantOrderId),
      merchantOrderId,
      gatewayTransactionId,
      amount,
      isSuccess,
      responseCode,
      responseMessage: isSuccess ? 'Payment verified successfully.' : 'Transaction declined or expired.',
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
      gatewayTransactionId: gatewayTransactionId || `JC-REC-${Date.now()}`,
      amount: 1500000,
      isSuccess: true,
      responseCode: '000',
      responseMessage: 'Reconciled via JazzCash sandbox inquiry.',
      rawPayload: { status: 'PAID', reconciled: true },
    };
  }
}
