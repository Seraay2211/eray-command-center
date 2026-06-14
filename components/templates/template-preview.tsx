import { renderTemplateForPreview } from "@/lib/templates/render-template-preview";
import type { ApplyTemplateContext } from "@/lib/templates/apply-template";
import { cn } from "@/lib/utils";

interface TemplatePreviewProps {
  className?: string;
  content: string;
  context?: ApplyTemplateContext;
  compact?: boolean;
}

export function TemplatePreview({
  className,
  content,
  context,
  compact = false,
}: TemplatePreviewProps) {
  const lines = renderTemplateForPreview(content, context);

  return (
    <div className={cn("space-y-2", className)}>
      {lines.map((line, index) => {
        if (line.kind === "spacer") {
          return compact ? null : <div className="h-1" key={index} />;
        }

        if (line.kind === "heading") {
          return (
            <h3
              className={cn(
                "app-text font-semibold",
                compact ? "text-sm" : "text-lg leading-7",
              )}
              key={index}
            >
              {line.text}
            </h3>
          );
        }

        if (line.kind === "subheading") {
          return (
            <h4
              className={cn(
                "app-text font-semibold",
                compact ? "text-xs" : "pt-1 text-sm",
              )}
              key={index}
            >
              {line.text}
            </h4>
          );
        }

        return (
          <p
            className={cn(
              "app-muted whitespace-pre-wrap",
              compact ? "text-[11px] leading-5" : "text-sm leading-7",
            )}
            key={index}
          >
            {line.text}
          </p>
        );
      })}
    </div>
  );
}
