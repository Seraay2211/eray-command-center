import { NextResponse } from "next/server";
import {
  deleteFinanceAttachment,
  getSignedFinanceFileUrl,
} from "@/services/finance-attachments-service";

interface RouteContext {
  params: Promise<{ attachmentId: string }>;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error, success: false }, { status });
}

export async function GET(_request: Request, context: RouteContext) {
  const { attachmentId } = await context.params;
  const result = await getSignedFinanceFileUrl(attachmentId);
  if (result.error || !result.data) {
    return jsonError(result.error ?? "Dosya görüntülenemedi.", 404);
  }
  return NextResponse.json({
    signedUrl: result.data.signedUrl,
    success: true,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { attachmentId } = await context.params;
  const result = await deleteFinanceAttachment(attachmentId);
  if (result.error || !result.data) {
    return jsonError(result.error ?? "Dosya silinemedi.", 400);
  }
  return NextResponse.json({ id: result.data.id, success: true });
}
