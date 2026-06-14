import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
}: EmptyStateProps) {
  return (
    <Card className="relative min-h-80 overflow-hidden p-6 sm:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_36%)]" />
      <div className="relative flex min-h-64 flex-col items-center justify-center text-center">
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
          <Icon className="size-6" />
        </div>
        <h2 className="app-text text-lg font-semibold">{title}</h2>
        <p className="app-muted mt-2 max-w-md text-sm leading-6">
          {description}
        </p>
        <Button className="mt-6" variant="secondary">
          Yakında kullanılabilir
          <ArrowUpRight className="size-4" />
        </Button>
      </div>
    </Card>
  );
}
