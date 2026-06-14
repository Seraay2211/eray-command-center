"use client";

import { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  FileCog,
  ListTodo,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { getCategoryDisplayName } from "@/lib/categories/display";
import { getTemplateVariableDefaults } from "@/lib/templates/apply-template";
import { Button } from "@/components/ui/button";
import { DarkSelect } from "@/components/ui/dark-select";
import type { Category, NoteWithRelations, Template } from "@/types";

interface InboxActionsProps {
  categories: Category[];
  isBusy?: boolean;
  note: NoteWithRelations;
  onApplyTemplate: (
    note: NoteWithRelations,
    template: Template,
    mode: "update" | "new",
    variables?: Record<string, string>,
  ) => Promise<void>;
  onConvertToReport: (note: NoteWithRelations) => Promise<void>;
  onConvertToTask: (note: NoteWithRelations) => Promise<void>;
  onMoveCategory: (note: NoteWithRelations, categoryId: string) => Promise<void>;
  onRefineWithAi: (note: NoteWithRelations) => void;
  templates: Template[];
}

export function InboxActions({
  categories,
  isBusy = false,
  note,
  onApplyTemplate,
  onConvertToReport,
  onConvertToTask,
  onMoveCategory,
  onRefineWithAi,
  templates,
}: InboxActionsProps) {
  const initialTemplate = templates[0] ?? null;
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const selectedTemplate =
    templates.find((template) => template.id === templateId) ?? null;
  const availableCategories = useMemo(
    () => categories.filter((category) => category.id !== note.category_id),
    [categories, note.category_id],
  );
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    () => getTemplateVariableDefaults(initialTemplate?.variables),
  );

  return (
    <div className="space-y-4 rounded-2xl border p-4 app-border app-surface-2">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-400">
          Hızlı Kayıt Isleme
        </p>
        <p className="mt-2 text-xs leading-6 app-muted">
          Hızlı kaydı şablona oturt, kategoriye taşı veya görev ve rapor akışına çevir.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
        <DarkSelect
          ariaLabel="Hızlı kayıt şablon seç"
          disabled={isBusy || templates.length === 0}
          onChange={(value) => {
            setTemplateId(value);
            const template = templates.find((item) => item.id === value) ?? null;
            setVariableValues(getTemplateVariableDefaults(template?.variables));
          }}
          options={
            templates.length > 0
              ? templates.map((template) => ({
                  label: template.name,
                  value: template.id,
                }))
              : [{ label: "Şablon bulunamadı", value: "" }]
          }
          value={templateId}
        />
        <Button
          disabled={isBusy || !selectedTemplate}
          onClick={() =>
            selectedTemplate
              ? void onApplyTemplate(note, selectedTemplate, "update", variableValues)
              : undefined
          }
          size="sm"
          variant="secondary"
        >
          <WandSparkles className="size-3.5" />
          Kaydı Güncelle
        </Button>
        <Button
          disabled={isBusy || !selectedTemplate}
          onClick={() =>
            selectedTemplate
              ? void onApplyTemplate(note, selectedTemplate, "new", variableValues)
              : undefined
          }
          size="sm"
        >
          <FileCog className="size-3.5" />
          Yeni Not
        </Button>
      </div>

      {selectedTemplate?.variables?.length ? (
        <div className="rounded-2xl border p-4 app-border app-surface">
          <p className="text-xs font-semibold app-text">Şablon alanlari</p>
          <p className="mt-1 text-[11px] app-muted">
            Bu şablona ozel değişkenleri buradan doldurabilirsin.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {selectedTemplate.variables.map((variable) => (
              <label className="text-xs font-medium app-muted" key={variable.key}>
                {variable.label}
                <input
                  className="app-input mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none"
                  onChange={(event) =>
                    setVariableValues((current) => ({
                      ...current,
                      [variable.key]: event.target.value,
                    }))
                  }
                  placeholder={variable.defaultValue || `{{${variable.key}}}`}
                  value={variableValues[variable.key] ?? ""}
                />
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <DarkSelect
          ariaLabel="Hızlı kayıt kategori seç"
          disabled={isBusy || availableCategories.length === 0}
          onChange={setCategoryId}
          options={
            availableCategories.length > 0
              ? [
                  { label: "Kategori seç", value: "" },
                  ...availableCategories.map((category) => ({
                    label: getCategoryDisplayName(category),
                    value: category.id,
                  })),
                ]
              : [{ label: "Tasiyacak kategori yok", value: "" }]
          }
          value={categoryId}
        />
        <Button
          disabled={isBusy || !categoryId}
          onClick={() => void onMoveCategory(note, categoryId)}
          size="sm"
          variant="secondary"
        >
          <ArrowRightLeft className="size-3.5" />
          Kategoriye Tasi
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button
          disabled={isBusy}
          onClick={() => void onConvertToTask(note)}
          size="sm"
          variant="secondary"
        >
          <ListTodo className="size-3.5" />
          Göreve Cevir
        </Button>
        <Button
          disabled={isBusy}
          onClick={() => void onConvertToReport(note)}
          size="sm"
          variant="secondary"
        >
          <FileCog className="size-3.5" />
          Rapora Cevir
        </Button>
        <Button
          disabled={isBusy}
          onClick={() => onRefineWithAi(note)}
          size="sm"
          variant="secondary"
        >
          <Sparkles className="size-3.5" />
          AI ile Düzenle
        </Button>
      </div>
    </div>
  );
}
