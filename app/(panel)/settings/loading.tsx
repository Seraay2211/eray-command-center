import { Card } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.025]" />
      <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <Card className="hidden h-96 animate-pulse lg:block">
          <span className="sr-only">Ayarlar menüsü yükleniyor</span>
        </Card>
        <Card className="h-[560px] animate-pulse">
          <span className="sr-only">Ayarlar yükleniyor</span>
        </Card>
      </div>
    </div>
  );
}
