"use server";

import { revalidatePath } from "next/cache";
import { createNote } from "@/features/notes/actions";
import {
  FINANCE_ATTACHMENT_SIGNED_URL_SECONDS,
  FINANCE_FILES_BUCKET,
  sanitizeFinanceAttachmentFileName,
  validateFinanceAttachmentFile,
} from "@/lib/finance/attachment-config";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, DebtAttachment } from "@/types";

const attachmentSelect =
  "id,user_id,debt_id,payment_id,file_name,file_path,file_type,file_size,attachment_type,ocr_text,ai_summary,created_at,updated_at";

function getErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : String(error);

  if (
    message.includes("debt_attachments") ||
    message.includes("finance-files") ||
    message.includes("Bucket not found") ||
    message.includes("schema cache")
  ) {
    return "Finans dosya alanı şu anda kullanıma hazırlanıyor. Birazdan tekrar deneyebilirsin.";
  }
  if (
    message.includes("row-level security") ||
    message.includes("permission denied")
  ) {
    return "Bu dosya üzerinde işlem yapma yetkin yok.";
  }
  return message || "Finans dosyası işlemi tamamlanamadı.";
}

function mapAttachment(raw: Record<string, unknown>): DebtAttachment {
  return {
    ...(raw as unknown as DebtAttachment),
    debt_id: typeof raw.debt_id === "string" ? raw.debt_id : null,
    payment_id: typeof raw.payment_id === "string" ? raw.payment_id : null,
    file_size: Number(raw.file_size) || 0,
    ocr_text: typeof raw.ocr_text === "string" ? raw.ocr_text : null,
    ai_summary: typeof raw.ai_summary === "string" ? raw.ai_summary : null,
  };
}

async function getContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yap.");
  }
  return { supabase, userId: data.user.id };
}

async function verifyTarget(
  debtId: string | null,
  paymentId: string | null,
) {
  if (Boolean(debtId) === Boolean(paymentId)) {
    throw new Error("Dosya yalnızca bir borca veya bir ödemeye bağlanmalıdır.");
  }

  const { supabase, userId } = await getContext();
  if (debtId) {
    const { data, error } = await supabase
      .from("debts")
      .select("id")
      .eq("id", debtId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Borç kaydı bulunamadı.");
  } else {
    const { data, error } = await supabase
      .from("debt_payments")
      .select("id")
      .eq("id", paymentId!)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Ödeme kaydı bulunamadı.");
  }
  return { supabase, userId };
}

export async function uploadFinanceAttachment(input: {
  debtId?: string | null;
  file: File;
  paymentId?: string | null;
}): Promise<ActionResult<DebtAttachment>> {
  try {
    const debtId = input.debtId?.trim() || null;
    const paymentId = input.paymentId?.trim() || null;
    const validationError = validateFinanceAttachmentFile(input.file);
    if (validationError) throw new Error(validationError);

    const { supabase, userId } = await verifyTarget(debtId, paymentId);
    const safeName = sanitizeFinanceAttachmentFileName(input.file.name);
    const parentPath = debtId
      ? `${userId}/debts/${debtId}`
      : `${userId}/payments/${paymentId}`;
    const filePath = `${parentPath}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(FINANCE_FILES_BUCKET)
      .upload(filePath, input.file, {
        cacheControl: "3600",
        contentType: input.file.type,
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("debt_attachments")
      .insert({
        attachment_type: "receipt",
        debt_id: debtId,
        file_name: input.file.name.slice(0, 255),
        file_path: filePath,
        file_size: input.file.size,
        file_type: input.file.type,
        payment_id: paymentId,
        user_id: userId,
      })
      .select(attachmentSelect)
      .single();

    if (error || !data) {
      await supabase.storage.from(FINANCE_FILES_BUCKET).remove([filePath]);
      throw error ?? new Error("Dosya kaydı oluşturulamadı.");
    }

    revalidatePath("/finance");
    return { data: mapAttachment(data), error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function listFinanceAttachments(input: {
  debtId?: string | null;
  paymentId?: string | null;
}): Promise<ActionResult<DebtAttachment[]>> {
  try {
    const debtId = input.debtId?.trim() || null;
    const paymentId = input.paymentId?.trim() || null;
    const { supabase, userId } = await verifyTarget(debtId, paymentId);
    let query = supabase
      .from("debt_attachments")
      .select(attachmentSelect)
      .eq("user_id", userId);

    query = debtId
      ? query.eq("debt_id", debtId)
      : query.eq("payment_id", paymentId!);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    if (error) throw error;
    return { data: (data ?? []).map(mapAttachment), error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteFinanceAttachment(
  attachmentId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, userId } = await getContext();
    const { data, error } = await supabase
      .from("debt_attachments")
      .select("id,file_path")
      .eq("id", attachmentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Dosya bulunamadı.");

    const { error: storageError } = await supabase.storage
      .from(FINANCE_FILES_BUCKET)
      .remove([data.file_path]);
    if (storageError) throw storageError;

    const { error: deleteError } = await supabase
      .from("debt_attachments")
      .delete()
      .eq("id", attachmentId)
      .eq("user_id", userId);
    if (deleteError) throw deleteError;

    revalidatePath("/finance");
    return { data: { id: attachmentId }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updateAttachmentOcrText(
  attachmentId: string,
  ocrText: string,
  aiSummary: string,
): Promise<ActionResult<DebtAttachment>> {
  try {
    const { supabase, userId } = await getContext();
    const { data, error } = await supabase
      .from("debt_attachments")
      .update({
        ai_summary: aiSummary.trim().slice(0, 4000),
        ocr_text: ocrText.trim().slice(0, 30000),
      })
      .eq("id", attachmentId)
      .eq("user_id", userId)
      .select(attachmentSelect)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Dosya bulunamadı.");
    return { data: mapAttachment(data), error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getSignedFinanceFileUrl(
  attachmentId: string,
): Promise<ActionResult<{ signedUrl: string }>> {
  try {
    const { supabase, userId } = await getContext();
    const { data, error } = await supabase
      .from("debt_attachments")
      .select("file_path")
      .eq("id", attachmentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Dosya bulunamadı.");

    const { data: signed, error: signedError } = await supabase.storage
      .from(FINANCE_FILES_BUCKET)
      .createSignedUrl(
        data.file_path,
        FINANCE_ATTACHMENT_SIGNED_URL_SECONDS,
      );
    if (signedError || !signed.signedUrl) {
      throw signedError ?? new Error("Dosya bağlantısı oluşturulamadı.");
    }
    return { data: { signedUrl: signed.signedUrl }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function appendAttachmentOcrToPaymentNote(
  attachmentId: string,
): Promise<ActionResult<{ paymentId: string }>> {
  try {
    const { supabase, userId } = await getContext();
    const { data: attachment, error } = await supabase
      .from("debt_attachments")
      .select("payment_id,file_name,ocr_text,ai_summary")
      .eq("id", attachmentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!attachment?.payment_id) {
      throw new Error("Bu dosya bir ödeme kaydına bağlı değil.");
    }
    if (!attachment.ocr_text) throw new Error("Önce dosyayı OCR ile okut.");

    const { data: payment, error: paymentError } = await supabase
      .from("debt_payments")
      .select("note")
      .eq("id", attachment.payment_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (paymentError) throw paymentError;
    if (!payment) throw new Error("Ödeme kaydı bulunamadı.");

    const addition = [
      `Dekont: ${attachment.file_name}`,
      attachment.ai_summary,
      attachment.ocr_text,
    ]
      .filter(Boolean)
      .join("\n");
    const nextNote = [payment.note?.trim(), addition].filter(Boolean).join("\n\n");
    const { error: updateError } = await supabase
      .from("debt_payments")
      .update({ note: nextNote.slice(0, 30000) })
      .eq("id", attachment.payment_id)
      .eq("user_id", userId);
    if (updateError) throw updateError;

    revalidatePath("/finance");
    return { data: { paymentId: attachment.payment_id }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function saveAttachmentOcrAsNote(
  attachmentId: string,
): Promise<ActionResult<{ noteId: string }>> {
  try {
    const { supabase, userId } = await getContext();
    const { data, error } = await supabase
      .from("debt_attachments")
      .select("file_name,ocr_text,ai_summary")
      .eq("id", attachmentId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Dosya bulunamadı.");
    if (!data.ocr_text) throw new Error("Önce dosyayı OCR ile okut.");

    const note = await createNote({
      categoryId: null,
      content: [data.ai_summary, data.ocr_text].filter(Boolean).join("\n\n"),
      isPinned: false,
      tags: ["finans", "dekont"],
      title: `Dekont OCR - ${data.file_name}`,
    });
    if (note.error || !note.data) {
      throw new Error(note.error ?? "Not oluşturulamadı.");
    }
    return { data: { noteId: note.data.id }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
