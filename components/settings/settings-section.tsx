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
    <Card className="overflow-visible">
      <div className="app-section-header app-border flex items-start gap-3 border-b px-5 py-4">
        <span className="app-surface-2 app-primary flex size-9 shrink-0 items-center justify-center rounded-[10px] border">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="app-text text-sm font-semibold">{title}</h2>
          <p className="app-muted mt-1 text-xs leading-5">{description}</p>
        </div>
      </div>
      <div className="app-section-body space-y-5 p-5">{children}</div>
    </Card>
  );
}
