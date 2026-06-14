"use client";

import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Plus, Sparkles, Trash2, X } from "lucide-react";
import { getCategoryDisplayName } from "@/lib/categories/display";
import { Button } from "@/components/ui/button";
import { DarkSelect } from "@/components/ui/dark-select";
import { TemplatePreview } from "@/components/templates/template-preview";
import { getTemplateVariableDefaults } from "@/lib/templates/apply-template";
import type {
  Category,
  CreateTemplateInput,
  Template,
  TemplateType,
  TemplateVariable,
} from "@/types";

interface TemplateFormProps {
  categories: Category[];
  error: string;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTemplateInput) => void;
  template: Template | null;
}

const typeOptions: Array<{ label: string; value: TemplateType }> = [
  { label: "Not", value: "note" },
  { label: "Rapor", value: "report" },
  { label: "Görev", value: "task" },
  { label: "AI Prompt", value: "ai_prompt" },
  { label: "Telegram", value: "telegram" },
  { label: "Operasyon", value: "operation" },
  { label: "Finans", value: "finance" },
  { label: "Yazılım", value: "software" },
  { label: "Günlük Plan", value: "daily_plan" },
];

const templateStarters: Array<{
  content: string;
  description: string;
  name: string;
  type: TemplateType;
}> = [
  {
    name: "Günlük Operasyon Raporu",
    description: "Gün sonu operasyon durumunu düzenli başlıklarla özetle.",
    type: "operation",
    content: `GÜNLÜK OPERASYON RAPORU - {{date}}

Genel Durum:

Tamamlanan İşler:

Bekleyen Konular:

Riskler:

Aksiyon Planı:`,
  },
  {
    name: "Yönetici Özeti",
    description: "Yönetime sunulacak kısa ve net durum özeti hazırla.",
    type: "report",
    content: `YÖNETİCİ ÖZETİ - {{date}}

Kısa Özet:

Kritik Başlıklar:

Karar Gerektiren Konular:

Aksiyonlar:`,
  },
  {
    name: "Finans Operasyon Notu",
    description: "Ödeme ve finans operasyonlarını standart bir formatta kaydet.",
    type: "finance",
    content: `FİNANS OPERASYON NOTU - {{date}}

Genel Durum:

Bekleyen İşlemler:

Tamamlanan İşlemler:

Riskli Başlıklar:

Takip Edilecek Aksiyonlar:`,
  },
  {
    name: "Telegram Post Taslağı",
    description: "Yayın öncesi mesaj metnini düzenli bir taslakla hazırla.",
    type: "telegram",
    content: `TELEGRAM POST TASLAĞI

Başlık:

Metin:

Çağrı / CTA:

Not:`,
  },
  {
    name: "Yazılım Hata Kaydı",
    description: "Yazılım hatalarını yeniden üretilebilir bir formatta kaydet.",
    type: "software",
    content: `YAZILIM HATA KAYDI - {{date}}

Hata Nerede Oldu?

Hata Mesajı:

Ne Denedim?

Muhtemel Sebep:

Çözüm Planı:

Sonuç:`,
  },
  {
    name: "Günlük Plan",
    description: "Günün önceliklerini ve takip maddelerini planla.",
    type: "daily_plan",
    content: `GÜNLÜK PLAN - {{date}}

Bugünün Ana Hedefi:

Öncelikli İşler:

Bekleyenler:

Notlar:

Gün Sonu Değerlendirme:`,
  },
  {
    name: "Toplantı Notu",
    description: "Görüşme notlarını, kararları ve aksiyonları düzenle.",
    type: "note",
    content: `TOPLANTI / GÖRÜŞME NOTU - {{date}}

Konu:

Katılımcılar:

Konuşulanlar:

Alınan Kararlar:

Yapılacaklar:

Takip Tarihi:`,
  },
  {
    name: "AI Fikir Kaydı",
    description: "AI fikirlerini problem, çıktı ve sonraki adımlarla kaydet.",
    type: "ai_prompt",
    content: `AI FİKİR KAYDI - {{date}}

Fikir:

Hangi Sorunu Çözer?

Nasıl Çalışır?

MVP:

Sonraki Adım:`,
  },
];

const smartVariables: TemplateVariable[] = [
  { key: "date", label: "Tarih" },
  { key: "time", label: "Saat" },
  { key: "user", label: "Kullanıcı" },
  { key: "title", label: "Başlık" },
  { key: "category", label: "Kategori" },
];

function buildInitialState(template: Template | null) {
  return {
    categoryId: template?.category_id ?? "",
    content: template?.content ?? "",
    description: template?.description ?? "",
    isFavorite: template?.is_favorite ?? false,
    name: template?.name ?? "",
    type: template?.template_type ?? "note",
    variables: template?.variables ?? [],
  };
}

export function TemplateForm({
  categories,
  error,
  isOpen,
  isSaving,
  onClose,
  onSubmit,
  template,
}: TemplateFormProps) {
  const initialState = useMemo(() => buildInitialState(template), [template]);
  const [name, setName] = useState(initialState.name);
  const [description, setDescription] = useState(initialState.description);
  const [type, setType] = useState<TemplateType>(initialState.type);
  const [content, setContent] = useState(initialState.content);
  const [categoryId, setCategoryId] = useState(initialState.categoryId);
  const [isFavorite, setIsFavorite] = useState(initialState.isFavorite);
  const [variables, setVariables] = useState<TemplateVariable[]>(
    initialState.variables,
  );
  const [showCustomVariables, setShowCustomVariables] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const categoryOptions = useMemo(
    () => [
      { label: "Kategori yok", value: "" },
      ...categories.map((category) => ({
        label: getCategoryDisplayName(category),
        value: category.id,
      })),
    ],
    [categories],
  );

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      category_id: categoryId || null,
      content,
      description,
      is_favorite: isFavorite,
      name,
      template_type: type,
      variables,
    });
  }

  function applyStarter(starter: (typeof templateStarters)[number]) {
    setName(starter.name);
    setDescription(starter.description);
    setType(starter.type);
    setContent(starter.content);
    setVariables(
      smartVariables.filter((variable) =>
        starter.content.includes(`{{${variable.key}}}`),
      ),
    );
  }

  function insertSmartVariable(variable: TemplateVariable) {
    const token = `{{${variable.key}}}`;
    const textarea = contentRef.current;
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? content.length;
    const spacer = start > 0 && !/\s$/.test(content.slice(0, start)) ? " " : "";
    const nextContent = `${content.slice(0, start)}${spacer}${token}${content.slice(end)}`;

    setContent(nextContent);
    setVariables((current) =>
      current.some((item) => item.key === variable.key)
        ? current
        : [...current, variable],
    );

    window.requestAnimationFrame(() => {
      const cursor = start + spacer.length + token.length;
      textarea?.focus();
      textarea?.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="fixed inset-0 z-[140]">
      <button
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <div className="absolute inset-0 flex items-end justify-center sm:items-start sm:px-4 sm:pt-6">
        <form
          className="app-card safe-bottom relative max-h-[94dvh] w-full max-w-6xl overflow-y-auto rounded-t-3xl border p-4 shadow-[0_30px_80px_rgba(0,0,0,0.38)] sm:rounded-3xl sm:p-6"
          onSubmit={handleSubmit}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                Şablon Formu
              </p>
              <h2 className="mt-1 text-xl font-semibold app-text">
                {template ? "Şablonu Düzenle" : "Yeni Şablon"}
              </h2>
            </div>
            <button className="app-muted transition hover:app-text" onClick={onClose} type="button">
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-5 rounded-2xl border p-4 app-border app-surface-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[color:var(--primary)]" />
              <p className="text-xs font-semibold app-text">Örnekten Başla</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {templateStarters.map((starter) => (
                <Button
                  key={starter.name}
                  onClick={() => applyStarter(starter)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {starter.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <label className="text-xs font-medium app-muted">
              Ad
              <input
                className="app-input mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none"
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </label>
            <label className="text-xs font-medium app-muted">
              Açıklama
              <input
                className="app-input mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none"
                onChange={(event) => setDescription(event.target.value)}
                value={description}
              />
            </label>
            <div>
              <p className="mb-2 text-xs font-medium app-muted">Tür</p>
              <DarkSelect
                ariaLabel="Şablon tipi"
                onChange={(value) => setType(value as TemplateType)}
                options={typeOptions}
                value={type}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium app-muted">Kategori</p>
              <DarkSelect
                ariaLabel="Şablon kategorisi"
                onChange={setCategoryId}
                options={categoryOptions}
                value={categoryId}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <label className="block text-xs font-medium app-muted">
                İçerik Editörü
                <textarea
                  className="app-input mt-2 min-h-[52dvh] w-full rounded-2xl border px-4 py-4 font-mono text-sm leading-7 outline-none sm:min-h-[420px]"
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Şablon içeriğini yaz. Akıllı değişkenleri aşağıdaki butonlarla ekleyebilirsin."
                  ref={contentRef}
                  value={content}
                />
              </label>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border p-4 app-border app-surface-2">
                <p className="text-xs font-semibold app-text">Canlı Önizleme</p>
                <p className="mt-1 text-[11px] app-muted">
                  Değişkenler örnek değerlerle doldurularak gösterilir.
                </p>
                <div className="mt-3 max-h-[360px] overflow-y-auto rounded-2xl border p-4 app-border app-surface">
                  <TemplatePreview
                    content={
                      content ||
                      "ÖNİZLEME\n\nŞablon içeriğini yazdıkça burada görünecek."
                    }
                    context={{
                      variables: getTemplateVariableDefaults(variables),
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border p-4 app-border app-surface-2">
                <p className="text-xs font-semibold app-text">
                  Akıllı Değişkenler
                </p>
                <p className="mt-1 text-[11px] leading-5 app-muted">
                  Şablon içine otomatik dolacak alanlar ekleyebilirsin.
                  Örneğin Tarih butonu şablona {"{{date}}"} ekler ve not
                  oluştururken bugünün tarihiyle değişir.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {smartVariables.map((variable) => (
                    <Button
                      key={variable.key}
                      onClick={() => insertSmartVariable(variable)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      <Plus className="size-3.5" />
                      {variable.label}
                    </Button>
                  ))}
                </div>

                <div className="mt-4 border-t pt-4 app-border">
                  <Button
                    onClick={() => setShowCustomVariables((current) => !current)}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    {showCustomVariables
                      ? "Özel Alanları Gizle"
                      : "Özel Değişken Ekle"}
                  </Button>
                </div>

                {showCustomVariables ? (
                <div className="mt-4 space-y-3">
                  <Button
                    onClick={() =>
                      setVariables((current) => [
                        ...current,
                        { key: "", label: "", defaultValue: "" },
                      ])
                    }
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    <Plus className="size-3.5" />
                    Yeni Özel Değişken
                  </Button>
                  {variables.map((variable, index) => (
                    smartVariables.some((item) => item.key === variable.key) ? null : (
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]" key={`${variable.key}-${index}`}>
                      <input
                        className="app-input h-11 rounded-xl border px-3 text-sm outline-none"
                        onChange={(event) =>
                          setVariables((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, key: event.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="key"
                        value={variable.key}
                      />
                      <input
                        className="app-input h-11 rounded-xl border px-3 text-sm outline-none"
                        onChange={(event) =>
                          setVariables((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, label: event.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Görünen ad"
                        value={variable.label}
                      />
                      <input
                        className="app-input h-11 rounded-xl border px-3 text-sm outline-none"
                        onChange={(event) =>
                          setVariables((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, defaultValue: event.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Varsayılan değer"
                        value={variable.defaultValue ?? ""}
                      />
                      <Button
                        onClick={() =>
                          setVariables((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    )
                  ))}
                </div>
                ) : null}
              </div>
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2 text-xs font-medium app-muted">
            <input
              checked={isFavorite}
              onChange={(event) => setIsFavorite(event.target.checked)}
              type="checkbox"
            />
            Favorilere ekle
          </label>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-400/15 bg-rose-500/[0.07] px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex justify-end gap-2">
            <Button onClick={onClose} type="button" variant="secondary">
              İptal
            </Button>
            <Button disabled={isSaving || !name.trim() || !content.trim()} type="submit">
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
