/**
 * WhatsApp delivery abstraction.
 *
 * The production implementation will call the WhatsApp Business API from a
 * server function. Until that is connected, `MockWhatsAppService` opens the
 * standard wa.me share sheet and reports that the PDF attachment step is
 * pending a real integration. Swap the exported instance to change providers.
 */

export interface WhatsAppMessage {
  to: string;
  text: string;
  /** Receipt PDF, passed through so real integration can attach it later. */
  attachment?: { filename: string; blob: Blob };
}

export interface WhatsAppResult {
  ok: boolean;
  provider: string;
  detail: string;
}

export interface WhatsAppService {
  sendReceipt(message: WhatsAppMessage): Promise<WhatsAppResult>;
  sendReminder(message: WhatsAppMessage): Promise<WhatsAppResult>;
}

function normalise(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

function openShare(message: WhatsAppMessage) {
  if (typeof window === "undefined") return;
  const url = `https://wa.me/${normalise(message.to)}?text=${encodeURIComponent(message.text)}`;
  window.open(url, "_blank", "noopener");
}

class MockWhatsAppService implements WhatsAppService {
  readonly provider = "mock";

  async sendReceipt(message: WhatsAppMessage): Promise<WhatsAppResult> {
    openShare(message);
    return {
      ok: true,
      provider: this.provider,
      detail: message.attachment
        ? "Message opened in WhatsApp. Attach the downloaded Pauti PDF, or connect the WhatsApp Business API to send it automatically."
        : "Message opened in WhatsApp.",
    };
  }

  async sendReminder(message: WhatsAppMessage): Promise<WhatsAppResult> {
    openShare(message);
    return {
      ok: true,
      provider: this.provider,
      detail: "Reminder opened in WhatsApp. Connect the WhatsApp Business API to automate reminders.",
    };
  }
}

export const whatsAppService: WhatsAppService = new MockWhatsAppService();

export function reminderText(params: {
  year: number;
  flatNo: string;
  remaining: number;
  mandalName: string;
}): string {
  return [
    "नमस्कार 🙏",
    "",
    `गणेशोत्सव ${params.year} ची वर्गणी अद्याप बाकी आहे.`,
    "",
    `फ्लॅट क्रमांक: ${params.flatNo}`,
    `बाकी रक्कम: ₹${params.remaining.toLocaleString("en-IN")}`,
    "",
    "आपल्या सोयीनुसार वर्गणी जमा करावी.",
    "",
    `— ${params.mandalName}`,
    "गणपती बाप्पा मोरया! 🙏",
  ].join("\n");
}

export function receiptText(params: {
  residentName: string;
  flatNo: string;
  amount: number;
  pautiNo: string;
  mandalName: string;
  year: number;
}): string {
  return [
    `नमस्कार ${params.residentName} 🙏`,
    "",
    `गणेशोत्सव ${params.year} वर्गणी मिळाली.`,
    `फ्लॅट: ${params.flatNo}`,
    `रक्कम: ₹${params.amount.toLocaleString("en-IN")}`,
    `पावती क्रमांक: ${params.pautiNo}`,
    "",
    `— ${params.mandalName}`,
    "गणपती बाप्पा मोरया! 🙏",
  ].join("\n");
}
