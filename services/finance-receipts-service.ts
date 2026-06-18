import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  FINANCE_RECEIPTS_BUCKET,
  FINANCE_RECEIPT_SIGNED_URL_SECONDS,
} from "@/lib/finance/receipt-config";

export function getFinanceReceiptErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : String(error);

  if (
    message.includes("Bucket not found") ||
    message.includes(FINANCE_RECEIPTS_BUCKET)
  ) {
    return "Dekont alanı şu anda kullanıma hazırlanıyor. Birazdan tekrar deneyebilirsin.";
  }

  if (
    message.includes("receipt_path") ||
    message.includes("ocr_status") ||
    message.includes("schema cache")
  ) {
    return "Dekont alanı şu anda kullanıma hazırlanıyor. Birazdan tekrar deneyebilirsin.";
  }

  if (
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("Unauthorized")
  ) {
    return "Bu dekont üzerinde işlem yapma yetkin yok.";
  }

  return message || "Dekont işlemi tamamlanamadı. Lütfen tekrar dene.";
}

export async function createFinanceReceiptSignedUrl(
  supabase: SupabaseClient,
  path: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(FINANCE_RECEIPTS_BUCKET)
    .createSignedUrl(path, FINANCE_RECEIPT_SIGNED_URL_SECONDS);

  if (error || !data.signedUrl) {
    throw error ?? new Error("Dekont bağlantısı oluşturulamadı.");
  }

  return data.signedUrl;
}

export async function removeFinanceReceipt(
  supabase: SupabaseClient,
  path: string,
): Promise<void> {
  const { error } = await supabase.storage
    .from(FINANCE_RECEIPTS_BUCKET)
    .remove([path]);

  if (error) {
    throw error;
  }
}
