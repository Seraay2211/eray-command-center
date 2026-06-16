import Link from "next/link";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function DailyJournalShortcut() {
  return (
    <Card className="h-full p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="app-primary-bg flex size-10 shrink-0 items-center justify-center rounded-xl">
          <CalendarDays className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="app-primary text-[10px] font-semibold uppercase tracking-[0.14em]">
            Günlük Not
          </p>
          <h2 className="app-text mt-1 text-base font-semibold">
            Günün Özeti
          </h2>
          <p className="app-muted mt-2 text-xs leading-6">
            Dağınık günlük notlarını düzenli ve özenli bir kayda çevir.
          </p>
        </div>
      </div>
      <Link
        className={buttonClassName({
          className: "mt-4 w-full justify-between",
          variant: "secondary",
        })}
        href="/ai?action=daily_summary"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="size-4" />
          Günün Özetini Yaz
        </span>
        <ArrowRight className="size-3.5" />
      </Link>
    </Card>
  );
}
