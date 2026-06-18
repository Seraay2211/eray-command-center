"use client";

import { useMemo, useState } from "react";
import {
  LayoutTemplate,
  LoaderCircle,
  Plus,
  SearchX,
  Sparkles,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createTemplate,
  deleteTemplate,
  getTemplates,
  seedSystemTemplates,
  toggleFavoriteTemplate,
  updateTemplate,
} from "@/services/templates-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DarkSelect } from "@/components/ui/dark-select";
import { TemplateCard } from "@/components/templates/template-card";
import { TemplateDetailPanel } from "@/components/templates/template-detail-panel";
import { TemplateForm } from "@/components/templates/template-form";
import { getUserFacingError } from "@/lib/user-facing-error";
import type {
  Category,
  CreateTemplateInput,
  Template,
  TemplateType,
} from "@/types";

interface TemplatesClientProps {
  categories: Category[];
  initialError: string;
  initialNewOpen: boolean;
  initialTemplates: Template[];
}

export function TemplatesClient({
  categories,
  initialError,
  initialNewOpen,
  initialTemplates,
}: TemplatesClientProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    initialTemplates[0] ?? null,
  );
  const [isFormOpen, setIsFormOpen] = useState(initialNewOpen);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | TemplateType>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [error, setError] = useState(() =>
    initialError ? getUserFacingError(initialError) : "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [notice, setNotice] = useState("");

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

    return templates.filter((template) => {
      const matchesType = type === "all" || template.template_type === type;
      const matchesFavorite = !favoritesOnly || template.is_favorite;
      const matchesQuery =
        !normalizedQuery ||
        template.name.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
        (template.description ?? "")
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedQuery);

      return matchesType && matchesFavorite && matchesQuery;
    });
  }, [favoritesOnly, query, templates, type]);

  async function handleSave(input: CreateTemplateInput) {
    setIsSaving(true);
    setError("");
    const result = editingTemplate
      ? await updateTemplate(editingTemplate.id, input)
      : await createTemplate(input);
    setIsSaving(false);

    if (result.error || !result.data) {
      setError(getUserFacingError(result.error, "Şablon kaydedilemedi."));
      return;
    }
    const savedTemplate = result.data;

    setTemplates((current) =>
      editingTemplate
        ? current.map((item) => (item.id === savedTemplate.id ? savedTemplate : item))
        : [savedTemplate, ...current],
    );
    setSelectedTemplate(savedTemplate);
    setEditingTemplate(null);
    setIsFormOpen(false);
    setNotice(editingTemplate ? "Şablon güncellendi." : "Şablon oluşturuldu.");
  }

  async function handleDelete(template: Template) {
    if (!window.confirm("Şablon silinsin mi?")) {
      return;
    }

    const result = await deleteTemplate(template.id);
    if (result.error) {
      setError(getUserFacingError(result.error));
      return;
    }

    setTemplates((current) => current.filter((item) => item.id !== template.id));
    if (selectedTemplate?.id === template.id) {
      setSelectedTemplate(null);
    }
    setNotice("Şablon silindi.");
  }

  async function handleFavorite(template: Template) {
    const result = await toggleFavoriteTemplate(template.id);
    if (result.error || !result.data) {
      setError(getUserFacingError(result.error, "Favori güncellenemedi."));
      return;
    }
    const savedTemplate = result.data;

    setTemplates((current) =>
      current.map((item) => (item.id === savedTemplate.id ? savedTemplate : item)),
    );
    if (selectedTemplate?.id === savedTemplate.id) {
      setSelectedTemplate(savedTemplate);
    }
  }

  async function handleSeedSystemTemplates() {
    setIsSeeding(true);
    setError("");
    const result = await seedSystemTemplates();
    setIsSeeding(false);

    if (result.error) {
      setError(getUserFacingError(result.error));
      return;
    }

    const templatesResult = await getTemplates();
    if (templatesResult.error || !templatesResult.data) {
      setError(
        getUserFacingError(templatesResult.error, "Şablonlar yenilenemedi."),
      );
      return;
    }

    setTemplates(templatesResult.data);
    setSelectedTemplate(
      (current) =>
        templatesResult.data?.find((item) => item.id === current?.id) ??
        templatesResult.data?.[0] ??
        null,
    );
    setNotice(
      result.data?.inserted
        ? `${result.data.inserted} sistem şablonu eklendi.`
        : "Sistem şablonları güncellendi.",
    );
    router.refresh();
  }

  function handleUse(template: Template) {
    router.push(`/notes?template=${template.id}`);
  }

  async function handleCopy(template: Template) {
    await navigator.clipboard.writeText(template.content);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
            Şablon Merkezi
          </p>
          <h1 className="app-text mt-2 text-2xl font-semibold tracking-tight">
            Şablonlar
          </h1>
          <p className="app-muted mt-2 text-sm">
            Not, rapor, görev ve AI metinleri için hazır çalışma formatlarını yönet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setEditingTemplate(null); setIsFormOpen(true); }} variant="secondary">
            <Plus className="size-4" />
            Yeni Şablon
          </Button>
          <Button disabled={isSeeding} onClick={() => void handleSeedSystemTemplates()}>
            {isSeeding ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Sistem Şablonlarını Güncelle
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-5 rounded-xl border border-rose-400/15 bg-rose-500/[0.07] p-4 text-xs leading-6 text-rose-200">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.08] p-4 text-xs text-emerald-500">
          {notice}
        </div>
      ) : null}

      <div className="mb-5 grid gap-3 rounded-2xl border p-4 sm:grid-cols-4 app-border app-card">
        <input
          className="app-input h-11 rounded-xl border px-3 text-sm outline-none sm:col-span-2"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Şablon ara..."
          value={query}
        />
        <DarkSelect
          ariaLabel="Şablon tipi"
          onChange={(value) => setType(value as "all" | TemplateType)}
          options={[
            { label: "Tüm tipler", value: "all" },
            { label: "Not", value: "note" },
            { label: "Rapor", value: "report" },
            { label: "Görev", value: "task" },
            { label: "AI Prompt", value: "ai_prompt" },
            { label: "Telegram", value: "telegram" },
            { label: "Operasyon", value: "operation" },
            { label: "Finans", value: "finance" },
            { label: "Yazılım", value: "software" },
            { label: "Günlük Plan", value: "daily_plan" },
          ]}
          value={type}
        />
        <Button onClick={() => setFavoritesOnly((current) => !current)} variant="secondary">
          <Star className="size-3.5" fill={favoritesOnly ? "currentColor" : "none"} />
          {favoritesOnly ? "Favoriler" : "Tümü"}
        </Button>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
        {filteredTemplates.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                onCopy={(item) => void handleCopy(item)}
                onDelete={(item) => void handleDelete(item)}
                onEdit={(item) => {
                  setEditingTemplate(item);
                  setIsFormOpen(true);
                }}
                onFavorite={(item) => void handleFavorite(item)}
                onSelect={setSelectedTemplate}
                onUse={handleUse}
                template={template}
              />
            ))}
          </div>
        ) : (
          <Card className="flex min-h-80 flex-col items-center justify-center p-6 text-center">
            <span className="app-primary-bg flex size-14 items-center justify-center rounded-2xl">
              {templates.length ? (
                <SearchX className="size-6" />
              ) : (
                <LayoutTemplate className="size-6" />
              )}
            </span>
            <h2 className="app-text mt-5 text-lg font-semibold">
              {templates.length
                ? "Eşleşen şablon bulunamadı"
                : "Henüz şablon yok"}
            </h2>
            <p className="app-muted mt-2 max-w-md text-sm leading-6">
              {templates.length
                ? "Arama ve filtreleri temizleyerek tüm şablonları tekrar görüntüleyebilirsin."
                : "Sistem şablonlarını yükleyebilir veya kendi çalışma formatını oluşturabilirsin."}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {templates.length ? (
                <Button
                  onClick={() => {
                    setQuery("");
                    setType("all");
                    setFavoritesOnly(false);
                  }}
                  variant="secondary"
                >
                  Filtreleri Temizle
                </Button>
              ) : (
                <Button
                  disabled={isSeeding}
                  onClick={() => void handleSeedSystemTemplates()}
                  variant="secondary"
                >
                  <Sparkles className="size-4" />
                  Sistem Şablonlarını Yükle
                </Button>
              )}
              <Button
                onClick={() => {
                  setEditingTemplate(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus className="size-4" />
                Yeni Şablon
              </Button>
            </div>
          </Card>
        )}
        <TemplateDetailPanel
          onCopy={(item) => void handleCopy(item)}
          onFavorite={(item) => void handleFavorite(item)}
          onUse={handleUse}
          template={selectedTemplate}
        />
      </div>

      <TemplateForm
        categories={categories}
        error={error}
        isOpen={isFormOpen}
        isSaving={isSaving}
        key={`${isFormOpen}-${editingTemplate?.id ?? "new"}`}
        onClose={() => { setIsFormOpen(false); setEditingTemplate(null); }}
        onSubmit={(input) => void handleSave(input)}
        template={editingTemplate}
      />
    </div>
  );
}
