"use server";

import { revalidatePath } from "next/cache";
import { createNote } from "@/features/notes/actions";
import { createClient } from "@/lib/supabase/server";
import { buildDailyOperationNote } from "@/lib/today/daily-operation-note";
import {
  getDailyOperationTitle,
  getTodaySummary,
} from "@/lib/today/today-summary";
import type { ActionResult } from "@/types";

interface DailyOperationNoteResult {
  id: string;
  created: boolean;
}

export async function createOrOpenDailyOperationNote(): Promise<
  ActionResult<DailyOperationNoteResult>
> {
  try {
    const summaryResult = await getTodaySummary();
    if (summaryResult.error || !summaryResult.data) {
      return {
        data: null,
        error: summaryResult.error ?? "Günlük not verileri hazırlanamadı.",
      };
    }

    if (summaryResult.data.existingDailyNote) {
      return {
        data: {
          id: summaryResult.data.existingDailyNote.id,
          created: false,
        },
        error: null,
      };
    }

    const title = getDailyOperationTitle(summaryResult.data.dateKey);
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return { data: null, error: "Oturum doğrulanamadı." };
    }

    const { data: existing, error: existingError } = await supabase
      .from("notes")
      .select("id")
      .eq("user_id", authData.user.id)
      .eq("status", "active")
      .eq("title", title)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing) {
      return {
        data: { id: String(existing.id), created: false },
        error: null,
      };
    }

    const createResult = await createNote({
      title,
      content: buildDailyOperationNote(summaryResult.data),
      categoryId: null,
      tags: ["günlük operasyon"],
      isPinned: false,
    });
    if (createResult.error || !createResult.data) {
      return {
        data: null,
        error: createResult.error ?? "Günlük operasyon notu oluşturulamadı.",
      };
    }

    revalidatePath("/today");
    return {
      data: { id: createResult.data.id, created: true },
      error: null,
    };
  } catch {
    return {
      data: null,
      error: "Günlük operasyon notu oluşturulamadı. Lütfen tekrar dene.",
    };
  }
}
