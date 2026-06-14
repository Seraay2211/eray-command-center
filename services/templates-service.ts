"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { applyTemplateVariables } from "@/lib/templates/apply-template";
import { slugifyTurkish } from "@/lib/utils/slugify";
import type {
  ActionResult,
  CreateTemplateInput,
  Template,
  TemplateType,
  TemplateVariable,
  UpdateTemplateInput,
} from "@/types";

const TEMPLATE_TYPES: TemplateType[] = [
  "note",
  "report",
  "task",
  "ai_prompt",
  "telegram",
  "operation",
  "finance",
  "software",
  "daily_plan",
];

const SYSTEM_TEMPLATES: Array<{
  content: string;
  description: string;
  name: string;
  template_type: TemplateType;
  variables: TemplateVariable[];
}> = [
  {
    name: "Günlük Operasyon Raporu",
    description: "Gün sonu operasyon özeti için temel rapor akışı.",
    template_type: "operation",
    variables: [
      { key: "date", label: "Tarih" },
      { key: "user", label: "Kullanıcı" },
    ],
    content: `GÜNLÜK OPERASYON RAPORU - {{date}}

Genel Durum:

Tamamlanan İşler:

Bekleyen Konular:

Riskler:

Aksiyon Planı:`,
  },
  {
    name: "Yönetici Özeti",
    description: "Yönetime sunulacak kısa ve net durum özeti.",
    template_type: "report",
    variables: [{ key: "date", label: "Tarih" }],
    content: `YÖNETİCİ ÖZETİ - {{date}}

Kısa Özet:

Kritik Başlıklar:

Karar Gerektiren Konular:

Aksiyonlar:`,
  },
  {
    name: "Finans Operasyon Notu",
    description: "Ödeme, borç ve finans akışlarını hızla kaydet.",
    template_type: "finance",
    variables: [{ key: "date", label: "Tarih" }],
    content: `FİNANS OPERASYON NOTU - {{date}}

Genel Durum:

Bekleyen İşlemler:

Tamamlanan İşlemler:

Riskli Başlıklar:

Takip Edilecek Aksiyonlar:`,
  },
  {
    name: "Telegram Post Taslağı",
    description: "Yayın öncesi hazır metin kalıbı.",
    template_type: "telegram",
    variables: [{ key: "title", label: "Başlık" }],
    content: `TELEGRAM POST TASLAĞI

Başlık:

Metin:

Çağrı / CTA:

Not:`,
  },
  {
    name: "AI Fikir Kaydı",
    description: "AI ürün ve otomasyon fikirlerini toplamak için.",
    template_type: "ai_prompt",
    variables: [{ key: "date", label: "Tarih" }],
    content: `AI FİKİR KAYDI - {{date}}

Fikir:

Hangi Sorunu Çözer?

Nasıl Çalışır?

MVP:

Sonraki Adım:`,
  },
  {
    name: "Yazılım Hata Kaydı",
    description: "Bug ve teknik sorunları standart formatta kaydet.",
    template_type: "software",
    variables: [{ key: "date", label: "Tarih" }],
    content: `YAZILIM HATA KAYDI - {{date}}

Hata Nerede Oldu?

Hata Mesajı:

Ne Denedim?

Muhtemel Sebep:

Çözüm Planı:

Sonuç:`,
  },
  {
    name: "Proje Geliştirme Notu",
    description: "Özellik, teknik karar ve ilerleme kaydı.",
    template_type: "software",
    variables: [{ key: "date", label: "Tarih" }],
    content: `PROJE GELİŞTİRME NOTU - {{date}}

Yapılan İş:

Değişen Dosyalar:

Test Sonucu:

Kalan Eksikler:

Sonraki Faz:`,
  },
  {
    name: "Günlük Plan",
    description: "Günlük öncelikleri ve odak maddelerini çıkar.",
    template_type: "daily_plan",
    variables: [{ key: "date", label: "Tarih" }],
    content: `GÜNLÜK PLAN - {{date}}

Bugünün Ana Hedefi:

Öncelikli İşler:

Bekleyenler:

Notlar:

Gün Sonu Değerlendirme:`,
  },
  {
    name: "Borç / Ödeme Planı",
    description: "Borçlar, tahsilatlar ve ödeme planı takibi.",
    template_type: "finance",
    variables: [{ key: "date", label: "Tarih" }],
    content: `BORÇ / ÖDEME PLANI - {{date}}

Toplam Durum:

Ödenecekler:

Bekleyenler:

Riskler:

Aksiyon Planı:`,
  },
  {
    name: "Toplantı / Görüşme Notu",
    description: "Toplantı kararlarını hızlıca yapılandır.",
    template_type: "note",
    variables: [{ key: "date", label: "Tarih" }],
    content: `TOPLANTI / GÖRÜŞME NOTU - {{date}}

Konu:

Katılımcılar:

Konuşulanlar:

Alınan Kararlar:

Yapılacaklar:

Takip Tarihi:`,
  },
];

function revalidateTemplateViews() {
  revalidatePath("/templates");
  revalidatePath("/notes");
}

function getErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : String(error);

  if (
    message.includes("PGRST205") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table")
  ) {
    return "Şablon tablosu hazır değil. SQL güncellemesini çalıştırın.";
  }

  return message || "Şablon işlemi tamamlanamadı.";
}

function normalizeVariables(
  variables: TemplateVariable[] | undefined,
): TemplateVariable[] {
  return (variables ?? [])
    .map((item) => ({
      defaultValue: item.defaultValue?.trim() || "",
      key: item.key.trim(),
      label: item.label.trim() || item.key.trim(),
    }))
    .filter((item) => item.key && item.label)
    .slice(0, 20);
}

function validateTemplateInput(
  input: CreateTemplateInput | UpdateTemplateInput,
  requireAll = false,
): UpdateTemplateInput {
  const values: UpdateTemplateInput = {};

  if (requireAll || input.name !== undefined) {
    const name = input.name?.trim() ?? "";
    if (!name) {
      throw new Error("Şablon adı zorunludur.");
    }
    values.name = name.slice(0, 120);
  }

  if (requireAll || input.template_type !== undefined) {
    const templateType = input.template_type ?? "note";
    if (!TEMPLATE_TYPES.includes(templateType)) {
      throw new Error("Geçersiz şablon tipi.");
    }
    values.template_type = templateType;
  }

  if (requireAll || input.content !== undefined) {
    const content = input.content?.trim() ?? "";
    if (!content) {
      throw new Error("Şablon içeriği boş olamaz.");
    }
    values.content = content;
  }

  if (input.description !== undefined) {
    values.description = input.description?.trim() || "";
  }

  if (input.category_id !== undefined) {
    values.category_id = input.category_id || null;
  }

  if (input.is_favorite !== undefined) {
    values.is_favorite = Boolean(input.is_favorite);
  }

  if (input.variables !== undefined) {
    values.variables = normalizeVariables(input.variables);
  }

  return values;
}

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Oturum bulunamadı. Lütfen tekrar giriş yap.");
  }

  return { supabase, userId: data.user.id };
}

async function fetchTemplateById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  templateId: string,
): Promise<Template> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .or(`user_id.eq.${userId},is_system.eq.true`)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("Bu şablona erişim yetkin yok.");
  }

  return data as Template;
}

export async function getTemplates(): Promise<ActionResult<Template[]>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .or(`user_id.eq.${userId},is_system.eq.true`)
      .order("is_favorite", { ascending: false })
      .order("is_system", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return { data: (data ?? []) as Template[], error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getTemplateById(
  templateId: string,
): Promise<ActionResult<Template>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    return {
      data: await fetchTemplateById(supabase, userId, templateId),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getTemplatesByType(
  templateType: TemplateType,
): Promise<ActionResult<Template[]>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("template_type", templateType)
      .or(`user_id.eq.${userId},is_system.eq.true`)
      .order("is_system", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return { data: (data ?? []) as Template[], error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createTemplate(
  input: CreateTemplateInput,
): Promise<ActionResult<Template>> {
  try {
    const values = validateTemplateInput(input, true);
    const { supabase, userId } = await getAuthenticatedContext();
    const { data, error } = await supabase
      .from("templates")
      .insert({
        ...values,
        is_favorite: values.is_favorite ?? false,
        is_system: false,
        user_id: userId,
      })
      .select("*")
      .single();

    if (error) throw error;

    revalidateTemplateViews();
    return { data: data as Template, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updateTemplate(
  templateId: string,
  input: UpdateTemplateInput,
): Promise<ActionResult<Template>> {
  try {
    const values = validateTemplateInput(input, false);
    const { supabase, userId } = await getAuthenticatedContext();
    const template = await fetchTemplateById(supabase, userId, templateId);

    if (template.is_system) {
      throw new Error("Sistem şablonları düzenlenemez.");
    }

    const { data, error } = await supabase
      .from("templates")
      .update(values)
      .eq("id", templateId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw error;

    revalidateTemplateViews();
    return { data: data as Template, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteTemplate(
  templateId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const template = await fetchTemplateById(supabase, userId, templateId);

    if (template.is_system) {
      throw new Error("Sistem şablonları silinemez.");
    }

    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", templateId)
      .eq("user_id", userId);

    if (error) throw error;

    revalidateTemplateViews();
    return { data: { id: templateId }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function toggleFavoriteTemplate(
  templateId: string,
): Promise<ActionResult<Template>> {
  try {
    const { supabase, userId } = await getAuthenticatedContext();
    const template = await fetchTemplateById(supabase, userId, templateId);

    const { data, error } = await supabase
      .from("templates")
      .update({
        is_favorite: !template.is_favorite,
      })
      .eq("id", templateId)
      .eq(template.is_system ? "is_system" : "user_id", template.is_system ? true : userId)
      .select("*")
      .single();

    if (error) throw error;

    revalidateTemplateViews();
    return { data: data as Template, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function seedSystemTemplates(): Promise<
  ActionResult<{ inserted: number }>
> {
  try {
    const { supabase } = await getAuthenticatedContext();
    const { data: existingTemplates, error: existingError } = await supabase
      .from("templates")
      .select("id,name,template_type")
      .eq("is_system", true);

    if (existingError) throw existingError;

    const existingByKey = new Map(
      (existingTemplates ?? []).map((template) => [
        `${slugifyTurkish(template.name)}:${template.template_type}`,
        template,
      ]),
    );
    const templatesToInsert: typeof SYSTEM_TEMPLATES = [];

    for (const template of SYSTEM_TEMPLATES) {
      const key = `${slugifyTurkish(template.name)}:${template.template_type}`;
      const existing = existingByKey.get(key);

      if (!existing) {
        templatesToInsert.push(template);
        continue;
      }

      const { error: updateError } = await supabase
        .from("templates")
        .update({
          content: template.content,
          description: template.description,
          name: template.name,
          variables: template.variables,
        })
        .eq("id", existing.id)
        .eq("is_system", true);

      if (updateError) throw updateError;
    }

    let inserted = 0;
    if (templatesToInsert.length > 0) {
      const { data, error } = await supabase
        .from("templates")
        .insert(
          templatesToInsert.map((template) => ({
            ...template,
            category_id: null,
            is_favorite: false,
            is_system: true,
            user_id: null,
          })),
        )
        .select("id");

      if (error) throw error;
      inserted = data?.length ?? 0;
    }

    revalidateTemplateViews();
    return { data: { inserted }, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function applyTemplateVariablesForUser(
  templateContent: string,
  variables: Record<string, string | undefined>,
): Promise<ActionResult<string>> {
  try {
    return {
      data: applyTemplateVariables(templateContent, { variables }),
      error: null,
    };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
