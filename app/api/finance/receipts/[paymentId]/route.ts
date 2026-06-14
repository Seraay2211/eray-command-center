import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createFinanceReceiptSignedUrl,
  getFinanceReceiptErrorMessage,
  removeFinanceReceipt,
} from "@/services/finance-receipts-service";

export const runtime = "nodejs";

interface ReceiptRouteProps {
  params: Promise<{
    paymentId: string;
  }>;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error, success: false }, { status });
}

async function getOwnedPayment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  paymentId: string,
) {
  const { data, error } = await supabase
    .from("debt_payments")
    .select("id,receipt_path")
    .eq("id", paymentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function GET(
  _request: Request,
  { params }: ReceiptRouteProps,
) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return jsonError("Oturum bulunamadı. Lütfen tekrar giriş yap.", 401);
  }

  try {
    const { paymentId } = await params;
    const payment = await getOwnedPayment(
      supabase,
      authData.user.id,
      paymentId,
    );

    if (!payment) {
      return jsonError("Bu dekontu görüntüleme yetkin yok.", 403);
    }
    if (!payment.receipt_path) {
      return jsonError("Bu ödeme için kayıtlı dekont bulunamadı.", 404);
    }

    return NextResponse.json({
      signedUrl: await createFinanceReceiptSignedUrl(
        supabase,
        payment.receipt_path,
      ),
      success: true,
    });
  } catch (error) {
    return jsonError(getFinanceReceiptErrorMessage(error), 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: ReceiptRouteProps,
) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return jsonError("Oturum bulunamadı. Lütfen tekrar giriş yap.", 401);
  }

  try {
    const { paymentId } = await params;
    const payment = await getOwnedPayment(
      supabase,
      authData.user.id,
      paymentId,
    );

    if (!payment) {
      return jsonError("Bu dekontu silme yetkin yok.", 403);
    }
    if (!payment.receipt_path) {
      return jsonError("Bu ödeme için kayıtlı dekont bulunamadı.", 404);
    }

    await removeFinanceReceipt(supabase, payment.receipt_path);

    const { error: updateError } = await supabase
      .from("debt_payments")
      .update({
        receipt_url: null,
        receipt_path: null,
        receipt_file_name: null,
        receipt_mime_type: null,
        ocr_status: "idle",
        ocr_result: null,
      })
      .eq("id", paymentId)
      .eq("user_id", authData.user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ id: paymentId, success: true });
  } catch (error) {
    return jsonError(getFinanceReceiptErrorMessage(error), 500);
  }
}
