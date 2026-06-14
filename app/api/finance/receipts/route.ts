import { NextResponse } from "next/server";
import {
  FINANCE_RECEIPTS_BUCKET,
  sanitizeFinanceReceiptFileName,
  validateFinanceReceiptFile,
} from "@/lib/finance/receipt-config";
import { createClient } from "@/lib/supabase/server";
import { getFinanceReceiptErrorMessage } from "@/services/finance-receipts-service";
import type {
  FinanceOcrResult,
  FinanceOcrStatus,
} from "@/types";

export const runtime = "nodejs";

const paymentReceiptSelect =
  "id,user_id,debt_id,amount,payment_date,method,note,receipt_url,receipt_path,receipt_file_name,receipt_mime_type,ocr_status,ocr_result,created_at";
const ocrStatuses: FinanceOcrStatus[] = [
  "idle",
  "processing",
  "success",
  "failed",
];

function jsonError(error: string, status: number) {
  return NextResponse.json({ error, success: false }, { status });
}

function nullableString(value: unknown, maxLength = 1000): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : null;
}

function parseOcrResult(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;

    const amount = Number(parsed.amount);
    const confidence =
      parsed.confidence === "medium" || parsed.confidence === "high"
        ? parsed.confidence
        : "low";

    return {
      amount: Number.isFinite(amount) && amount > 0 ? amount : null,
      payment_date:
        typeof parsed.payment_date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(parsed.payment_date)
          ? parsed.payment_date
          : null,
      method: nullableString(parsed.method),
      bank: nullableString(parsed.bank),
      sender: nullableString(parsed.sender),
      receiver: nullableString(parsed.receiver),
      reference_no: nullableString(parsed.reference_no),
      description: nullableString(parsed.description),
      confidence,
      raw_text: nullableString(parsed.raw_text, 12000) ?? "",
      warning: nullableString(parsed.warning),
    } satisfies FinanceOcrResult;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return jsonError("Oturum bulunamadı. Lütfen tekrar giriş yap.", 401);
  }

  try {
    const formData = await request.formData();
    const paymentIdValue = formData.get("paymentId");
    const fileValue = formData.get("file");
    const statusValue = formData.get("ocrStatus");
    const paymentId =
      typeof paymentIdValue === "string" ? paymentIdValue.trim() : "";
    const ocrStatus = ocrStatuses.includes(statusValue as FinanceOcrStatus)
      ? (statusValue as FinanceOcrStatus)
      : "idle";

    if (!paymentId) {
      return jsonError("Dekontun bağlanacağı ödeme bulunamadı.", 400);
    }
    if (!(fileValue instanceof File) || fileValue.size <= 0) {
      return jsonError("Yüklenecek dekont görseli seçilmedi.", 400);
    }

    const validationError = validateFinanceReceiptFile(fileValue);
    if (validationError) {
      return jsonError(validationError, 400);
    }

    const { data: payment, error: paymentError } = await supabase
      .from("debt_payments")
      .select("id,receipt_path")
      .eq("id", paymentId)
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (paymentError) throw paymentError;
    if (!payment) {
      return jsonError("Bu ödemeye dekont ekleme yetkin yok.", 403);
    }

    const safeFileName = sanitizeFinanceReceiptFileName(fileValue.name);
    const path = `${authData.user.id}/payments/${paymentId}/${Date.now()}-${safeFileName}`;
    const { error: uploadError } = await supabase.storage
      .from(FINANCE_RECEIPTS_BUCKET)
      .upload(path, fileValue, {
        cacheControl: "3600",
        contentType: fileValue.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const publicLocator = supabase.storage
      .from(FINANCE_RECEIPTS_BUCKET)
      .getPublicUrl(path).data.publicUrl;
    const { data: updatedPayment, error: updateError } = await supabase
      .from("debt_payments")
      .update({
        receipt_url: publicLocator,
        receipt_path: path,
        receipt_file_name: fileValue.name,
        receipt_mime_type: fileValue.type,
        ocr_status: ocrStatus,
        ocr_result: parseOcrResult(formData.get("ocrResult")),
      })
      .eq("id", paymentId)
      .eq("user_id", authData.user.id)
      .select(paymentReceiptSelect)
      .maybeSingle();

    if (updateError || !updatedPayment) {
      await supabase.storage.from(FINANCE_RECEIPTS_BUCKET).remove([path]);
      throw updateError ?? new Error("Ödeme dekont bilgisi güncellenemedi.");
    }

    if (payment.receipt_path && payment.receipt_path !== path) {
      await supabase.storage
        .from(FINANCE_RECEIPTS_BUCKET)
        .remove([payment.receipt_path]);
    }

    return NextResponse.json({
      payment: updatedPayment,
      success: true,
    });
  } catch (error) {
    return jsonError(getFinanceReceiptErrorMessage(error), 500);
  }
}
