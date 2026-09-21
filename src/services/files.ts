/**
 * File storage abstraction for expense bills.
 * The dev implementation keeps a base64 data URL with the record; a future
 * implementation can upload to object storage and store the returned URL.
 */
import type { ExpenseAttachment } from "@/types";

export const ACCEPTED_BILL_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const MAX_BILL_BYTES = 3 * 1024 * 1024;

export interface FileStorageService {
  upload(file: File): Promise<ExpenseAttachment>;
}

class LocalFileStorage implements FileStorageService {
  async upload(file: File): Promise<ExpenseAttachment> {
    if (!ACCEPTED_BILL_TYPES.includes(file.type)) {
      throw new Error("Only PDF, JPG or PNG bills can be uploaded.");
    }
    if (file.size > MAX_BILL_BYTES) {
      throw new Error("Bill file is too large. Please upload a file under 3 MB.");
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Unable to read the selected file."));
      reader.readAsDataURL(file);
    });
    return { name: file.name, type: file.type, dataUrl };
  }
}

export const fileStorage: FileStorageService = new LocalFileStorage();

export function openAttachment(attachment: ExpenseAttachment) {
  const win = window.open();
  if (!win) return;
  if (attachment.type === "application/pdf") {
    win.document.write(
      `<iframe src="${attachment.dataUrl}" style="border:0;width:100%;height:100%"></iframe>`,
    );
  } else {
    win.document.write(
      `<img src="${attachment.dataUrl}" style="max-width:100%" alt="${attachment.name}" />`,
    );
  }
}
