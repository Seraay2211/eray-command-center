"use client";

import { Copy, Pencil, Star, Trash2, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TemplateTypeBadge } from "@/components/templates/template-type-badge";
import { cleanTemplatePreview } from "@/lib/templates/render-template-preview";
import { getTemplateVariableDefaults } from "@/lib/templates/apply-template";
import type { Template } from "@/types";

interface TemplateCardProps {
  onCopy: (template: Template) => void;
  onDelete: (template: Template) => void;
  onEdit: (template: Template) => void;
  onFavorite: (template: Template) => void;
  onSelect: (template: Template) => void;
  onUse: (template: Template) => void;
  template: Template;
}

export function TemplateCard({
  onCopy,
  onDelete,
  onEdit,
  onFavorite,
  onSelect,
  onUse,
  template,
}: TemplateCardProps) {
  return (
    <Card className="group relative flex h-full flex-col p-4 transition hover:-translate-y-0.5 hover:app-surface-2">
      <button
        className="absolute inset-0 rounded-2xl"
        onClick={() => onSelect(template)}
        type="button"
      />
      <div className="relative z-[1] flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TemplateTypeBadge type={template.template_type} />
            {template.is_system ? (
              <span className="inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold text-violet-300 app-border">
                Sistem
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 line-clamp-2 text-sm font-semibold app-text">
            {template.name}
          </h3>
        </div>
        <button
          className="app-muted relative z-10 transition hover:text-amber-500"
          onClick={(event) => {
            event.stopPropagation();
            onFavorite(template);
          }}
          type="button"
        >
          <Star
            className="size-4"
            fill={template.is_favorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      <p className="relative z-[1] mt-3 text-xs leading-6 app-muted">
        {template.description?.trim() || "Açıklama eklenmemiş."}
      </p>
      <p className="relative z-[1] mt-3 line-clamp-4 rounded-2xl border p-3 text-[11px] leading-6 app-border app-surface-2 app-muted">
        {cleanTemplatePreview(template.content, {
          variables: getTemplateVariableDefaults(template.variables),
        })}
      </p>

      <div className="relative z-[1] mt-auto flex flex-wrap gap-2 pt-4">
        <Button onClick={() => onUse(template)} size="sm">
          <WandSparkles className="size-3.5" />
          Şablonu Kullan
        </Button>
        {!template.is_system ? (
          <Button onClick={() => onEdit(template)} size="sm" variant="secondary">
            <Pencil className="size-3.5" />
            Düzenle
          </Button>
        ) : null}
        <Button onClick={() => onCopy(template)} size="sm" variant="secondary">
          <Copy className="size-3.5" />
          Kopyala
        </Button>
        {!template.is_system ? (
          <Button
            className="text-rose-300"
            onClick={() => onDelete(template)}
            size="sm"
            variant="secondary"
          >
            <Trash2 className="size-3.5" />
            Sil
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
