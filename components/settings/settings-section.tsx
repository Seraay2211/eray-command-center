import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface SettingsSectionProps {
  children: ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
}

export function SettingsSection({
  children,
  description,
  icon: Icon,
  title,
}: SettingsSectionProps) {
  return (
    <Card className="min-w-0 max-w-full overflow-visible">
      <div className="app-section-header app-border flex min-w-0 items-start gap-3 border-b px-4 py-3.5 sm:px-5">
        <span className="app-surface-2 app-primary flex size-9 shrink-0 items-center justify-center rounded-[10px] border">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="app-text text-sm font-semibold">{title}</h2>
          <p className="app-muted mt-1 text-xs leading-5 [overflow-wrap:anywhere]">
            {description}
          </p>
        </div>
      </div>
      <div className="app-section-body min-w-0 space-y-5 p-4 sm:p-5">
        {children}
      </div>
    </Card>
  );
}
