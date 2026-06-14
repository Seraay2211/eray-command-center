import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LoaderCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface RouteStatusProps {
  action?: ReactNode;
  description: string;
  icon?: LucideIcon;
  title: string;
}

export function RouteStatus({
  action,
  description,
  icon: Icon = LoaderCircle,
  title,
}: RouteStatusProps) {
  return (
    <main className="app-bg flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg p-6 text-center sm:p-8">
        <span className="app-primary-bg mx-auto flex size-14 items-center justify-center rounded-2xl shadow-lg">
          <Icon
            className={`size-6 ${Icon === LoaderCircle ? "animate-spin" : ""}`}
          />
        </span>
        <h1 className="app-text mt-5 text-xl font-semibold">{title}</h1>
        <p className="app-muted mx-auto mt-2 max-w-sm text-sm leading-6">
          {description}
        </p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </Card>
    </main>
  );
}
