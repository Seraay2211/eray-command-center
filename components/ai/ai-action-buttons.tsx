import {
  Bot,
  CalendarDays,
  FileText,
  LoaderCircle,
  WandSparkles,
  Zap,
} from "lucide-react";
import { AI_ACTIONS } from "@/lib/ai/actions";
import { Button } from "@/components/ui/button";
import type { AiActionKey } from "@/types";

interface AiActionButtonsProps {
  activeAction: AiActionKey | null;
  includeCommandSummary?: boolean;
  disabled?: boolean;
  includeDailySummary?: boolean;
  mode?: "run" | "select";
  onAction: (action: AiActionKey) => void;
  selectedAction?: AiActionKey;
}

const iconMap = {
  Bot,
  CalendarDays,
  FileText,
  WandSparkles,
  Zap,
} as const;

export function AiActionButtons({
  activeAction,
  disabled = false,
  includeCommandSummary = false,
  includeDailySummary = false,
  onAction,
  selectedAction,
}: AiActionButtonsProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {AI_ACTIONS.filter(
        (action) =>
          (includeDailySummary || action.key !== "daily_summary") &&
          (includeCommandSummary || action.key !== "command_summary"),
      ).map((action) => {
        const Icon = action.iconName ? iconMap[action.iconName as keyof typeof iconMap] : Bot;
        const isActive = activeAction === action.key;
        const isSelected = selectedAction === action.key;

        return (
          <Button
            className={`h-auto min-h-12 justify-start px-3 py-3 text-left ${
              isSelected
                ? "border-[color-mix(in_srgb,var(--primary)_45%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_12%,var(--surface-2))] app-text"
                : ""
            }`}
            disabled={disabled}
            key={action.key}
            onClick={() => onAction(action.key)}
            size="sm"
            variant="secondary"
          >
            {isActive ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Icon className="size-3.5 shrink-0" />
            )}
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-semibold">
                {action.label}
              </span>
              <span className="mt-0.5 block whitespace-normal text-[10px] font-normal leading-4 app-muted">
                {action.description}
              </span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}
