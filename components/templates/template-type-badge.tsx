"use client";

import type { TemplateType } from "@/types";

const labelMap: Record<TemplateType, string> = {
  ai_prompt: "AI Prompt",
  daily_plan: "Günlük Plan",
  finance: "Finans",
  note: "Not",
  operation: "Operasyon",
  report: "Rapor",
  software: "Yazılım",
  task: "Görev",
  telegram: "Telegram",
};

export function TemplateTypeBadge({ type }: { type: TemplateType }) {
  return (
    <span className="inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold app-border app-surface-2 app-text">
      {labelMap[type]}
    </span>
  );
}
