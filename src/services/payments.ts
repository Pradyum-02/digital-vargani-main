/**
 * Payment verification abstraction.
 *
 * No real gateway is connected yet. `ManualPaymentService` records what the
 * collector reports (UPI reference, cash, cheque number, bank transfer) and
 * marks it as manually verified. A real UPI/gateway provider can implement the
 * same interface later without touching UI code.
 */
import type { PaymentMethod } from "@/types";

export interface PaymentVerificationRequest {
  amount: number;
  method: PaymentMethod;
  reference?: string | undefined;
}

export interface PaymentVerificationResult {
  verified: boolean;
  provider: string;
  reference?: string | undefined;
  message: string;
}

export interface PaymentService {
  verify(request: PaymentVerificationRequest): Promise<PaymentVerificationResult>;
}

class ManualPaymentService implements PaymentService {
  readonly provider = "manual";

  async verify(request: PaymentVerificationRequest): Promise<PaymentVerificationResult> {
    if (!Number.isFinite(request.amount) || request.amount <= 0) {
      return {
        verified: false,
        provider: this.provider,
        message: "Amount must be greater than zero.",
      };
    }
    return {
      verified: true,
      provider: this.provider,
      reference: request.reference,
      message: "Recorded as manually verified by the collector.",
    };
  }
}

export const paymentService: PaymentService = new ManualPaymentService();
