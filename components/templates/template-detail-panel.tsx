"use client";

import { Copy, Star, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TemplateTypeBadge } from "@/components/templates/template-type-badge";
import { TemplatePreview } from "@/components/templates/template-preview";
import { getTemplateVariableDefaults } from "@/lib/templates/apply-template";
import type { Template } from "@/types";

interface TemplateDetailPanelProps {
  onCopy: (template: Template) => void;
  onFavorite: (template: Template) => void;
  onUse: (template: Template) => void;
  template: Template | null;
}

export function TemplateDetailPanel({
  onCopy,
  onFavorite,
  onUse,
  template,
}: TemplateDetailPanelProps) {
  if (!template) {
    return (
      <Card className="hidden min-h-[480px] items-center justify-center p-8 text-center xl:flex">
        <div>
          <p className="text-sm font-semibold app-text">Bir şablon seç</p>
          <p className="mt-2 text-xs leading-6 app-muted">
            Tam içerik ve akıllı alanlar sağ panelde görünür.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex min-h-[480px] flex-col overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <TemplateTypeBadge type={template.template_type} />
            {template.is_system ? (
              <span className="inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold text-violet-300 app-border">
                Sistem
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 text-xl font-semibold app-text">{template.name}</h2>
          <p className="mt-2 text-sm app-muted">
            {template.description?.trim() || "Açıklama yok."}
          </p>
        </div>
        <button
          className="app-muted transition hover:text-amber-500"
          onClick={() => onFavorite(template)}
          type="button"
        >
          <Star
            className="size-4"
            fill={template.is_favorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={() => onUse(template)} size="sm">
          <WandSparkles className="size-3.5" />
          Şablonu Kullan
        </Button>
        <Button onClick={() => onCopy(template)} size="sm" variant="secondary">
          <Copy className="size-3.5" />
          Kopyala
        </Button>
      </div>

      {template.variables?.length ? (
        <div className="mt-5 rounded-2xl border p-4 app-border app-surface-2">
          <p className="text-xs font-semibold app-text">Akıllı Değişkenler</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {template.variables.map((variable) => (
              <span
                className="inline-flex rounded-full border px-2.5 py-1 text-[10px] app-border app-muted"
                key={variable.key}
              >
                {variable.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto rounded-2xl border p-5 app-border app-surface-2">
        <TemplatePreview
          content={template.content}
          context={{
            variables: getTemplateVariableDefaults(template.variables),
          }}
        />
      </div>
    </Card>
  );
}
