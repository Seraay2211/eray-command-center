import { Card } from "@/components/ui/card";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.025]" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <Card className="h-36 animate-pulse bg-white/[0.02]" key={item}>
              <span className="sr-only">Rapor yükleniyor</span>
            </Card>
          ))}
        </div>
        <Card className="hidden h-[520px] animate-pulse bg-white/[0.02] lg:block">
          <span className="sr-only">Rapor detayı yükleniyor</span>
        </Card>
      </div>
    </div>
  );
}
