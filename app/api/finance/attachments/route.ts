import { NextResponse } from "next/server";
import {
  listFinanceAttachments,
  uploadFinanceAttachment,
} from "@/services/finance-attachments-service";

export const runtime = "nodejs";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error, success: false }, { status });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const debtId = url.searchParams.get("debt_id");
  const paymentId = url.searchParams.get("payment_id");

  if (Boolean(debtId) === Boolean(paymentId)) {
    return jsonError("Borç veya ödeme bağlantısı belirtilmelidir.", 400);
  }

  const result = await listFinanceAttachments({ debtId, paymentId });
  if (result.error || !result.data) {
    return jsonError(result.error ?? "Dosyalar yüklenemedi.", 400);
  }

  return NextResponse.json({
    attachments: result.data,
    success: true,
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const debtIdValue = formData.get("debtId");
    const paymentIdValue = formData.get("paymentId");

    if (!(file instanceof File)) {
      return jsonError("Yüklenecek dosya seçilmedi.", 400);
    }

    const result = await uploadFinanceAttachment({
      debtId: typeof debtIdValue === "string" ? debtIdValue : null,
      file,
      paymentId: typeof paymentIdValue === "string" ? paymentIdValue : null,
    });
    if (result.error || !result.data) {
      return jsonError(result.error ?? "Dosya yüklenemedi.", 400);
    }

    return NextResponse.json({
      attachment: result.data,
      success: true,
    });
  } catch {
    return jsonError("Dosya yüklenemedi. Lütfen tekrar dene.", 500);
  }
}
