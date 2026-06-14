"use client";

import { useMemo, useState } from "react";
import { WandSparkles, X } from "lucide-react";
import {
  applyTemplateVariables,
  cleanSystemTemplateContent,
  getTemplateVariableDefaults,
} from "@/lib/templates/apply-template";
import { Button } from "@/components/ui/button";
import { DarkSelect } from "@/components/ui/dark-select";
import { TemplateTypeBadge } from "@/components/templates/template-type-badge";
import { TemplatePreview } from "@/components/templates/template-preview";
import { cleanTemplatePreview } from "@/lib/templates/render-template-preview";
import type { Template } from "@/types";

interface TemplatePickerProps {
  category?: string | null;
  isOpen: boolean;
  onApply: (payload: {
    renderedContent: string;
    template: Template;
    variables: Record<string, string>;
  }) => void;
  onClose: () => void;
  templates: Template[];
  title?: string | null;
  user?: string | null;
}

export function TemplatePicker({
  category = "",
  isOpen,
  onApply,
  onClose,
  templates,
  title = "",
  user = "",
}: TemplatePickerProps) {
  const initialTemplate = templates[0] ?? null;
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialTemplate?.id ?? "",
  );
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ?? null;
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    () => getTemplateVariableDefaults(initialTemplate?.variables),
  );

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

    return templates.filter((template) => {
      const matchesType = type === "all" || template.template_type === type;
      const matchesQuery =
        !normalizedQuery ||
        template.name.toLocaleLowerCase("tr-TR").includes(normalizedQuery) ||
        (template.description ?? "")
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedQuery);

      return matchesType && matchesQuery;
    });
  }, [query, templates, type]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[150]">
      <button
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <div className="absolute inset-0 flex items-end justify-center sm:items-start sm:px-4 sm:pt-8">
        <div className="app-card safe-bottom relative grid max-h-[94dvh] w-full max-w-6xl gap-0 overflow-y-auto rounded-t-3xl border shadow-[0_30px_80px_rgba(0,0,0,0.38)] sm:rounded-3xl lg:grid-cols-[360px_minmax(0,1fr)] lg:overflow-hidden">
          <div className="p-4 app-border app-surface lg:border-r lg:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                  Şablon Seçimi
                </p>
                <h2 className="mt-1 text-lg font-semibold app-text">
                  Şablondan Başla
                </h2>
              </div>
              <button className="app-muted transition hover:app-text" onClick={onClose} type="button">
                <X className="size-5" />
              </button>
            </div>

            <input
              className="app-input mt-4 h-11 w-full rounded-xl border px-3 text-sm outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Şablon ara..."
              value={query}
            />
            <div className="mt-3">
              <DarkSelect
                ariaLabel="Şablon tipi filtresi"
                onChange={setType}
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
            </div>

            <div className="mt-4 max-h-[38dvh] space-y-2 overflow-y-auto pr-1 lg:max-h-[60vh]">
              {filteredTemplates.map((template) => (
                <button
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    selectedTemplateId === template.id
                      ? "border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,var(--surface))]"
                      : "app-border app-surface-2 hover:app-surface"
                  }`}
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setVariableValues(
                      getTemplateVariableDefaults(template.variables),
                    );
                  }}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <TemplateTypeBadge type={template.template_type} />
                    {template.is_system ? (
                      <span className="text-[10px] text-violet-300">Sistem</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm font-semibold app-text">
                    {template.name}
                  </p>
                  <p className="mt-1 text-xs leading-5 app-muted">
                    {template.description?.trim() || "Açıklama yok."}
                  </p>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-5 app-muted">
                    {cleanTemplatePreview(template.content, {}, 120)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 p-4 app-surface sm:p-5 lg:min-h-[500px]">
            {selectedTemplate ? (
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2">
                  <TemplateTypeBadge type={selectedTemplate.template_type} />
                  <p className="text-sm font-semibold app-text">
                    {selectedTemplate.name}
                  </p>
                </div>

                {selectedTemplate.variables?.length ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
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
                          value={variableValues[variable.key] ?? variable.defaultValue ?? ""}
                        />
                      </label>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-2xl border p-5 app-border app-surface-2">
                  <TemplatePreview
                    content={selectedTemplate.content}
                    context={{
                      category,
                      title,
                      user,
                      variables: variableValues,
                    }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                  <Button className="w-full sm:w-auto" onClick={onClose} type="button" variant="secondary">
                    Kapat
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() =>
                      onApply({
                        renderedContent: applyTemplateVariables(
                          selectedTemplate.is_system
                            ? cleanSystemTemplateContent(selectedTemplate.content)
                            : selectedTemplate.content,
                          {
                            category,
                            title,
                            user,
                            variables: variableValues,
                          },
                        ),
                        template: selectedTemplate,
                        variables: variableValues,
                      })
                    }
                    type="button"
                  >
                    <WandSparkles className="size-3.5" />
                    Uygula
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <p className="text-sm font-semibold app-text">Bir şablon seç</p>
                  <p className="mt-2 text-xs leading-6 app-muted">
                    Seçilen şablonun önizlemesi ve değişken alanları burada görünür.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
