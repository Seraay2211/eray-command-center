import { FilePlus2, NotebookPen, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyNotesProps {
  isFiltered: boolean;
  onCreate: () => void;
  onResetFilters: () => void;
}

export function EmptyNotes({
  isFiltered,
  onCreate,
  onResetFilters,
}: EmptyNotesProps) {
  const Icon = isFiltered ? SearchX : NotebookPen;

  return (
    <Card className="relative overflow-hidden py-16 text-center sm:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.08),transparent_42%)]" />
      <div className="relative mx-auto max-w-md px-6">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-500/[0.08] text-violet-300">
          <Icon className="size-6" />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-zinc-100">
          {isFiltered ? "Aramana uygun not bulunamadı" : "İlk notunu oluştur"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          {isFiltered
            ? "Arama kelimesini veya kategori filtresini değiştirerek tekrar deneyebilirsin."
            : "Operasyon kayıtlarını, fikirlerini ve kişisel planlarını tek bir çalışma alanında toplamaya başla."}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          {isFiltered ? (
            <Button onClick={onResetFilters} variant="secondary">
              Filtreleri temizle
            </Button>
          ) : null}
          <Button onClick={onCreate}>
            <FilePlus2 className="size-4" />
            Yeni Not
          </Button>
        </div>
      </div>
    </Card>
  );
}
