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
        <span className="app-primary-bg mx-auto flex size-14 items-center justify-center rounded-2xl">
          <Icon className="size-6" />
        </span>
        <h2 className="app-text mt-5 text-lg font-semibold">
          {isFiltered ? "Aramana uygun not bulunamadı" : "Henüz not yok"}
        </h2>
        <p className="app-muted mt-2 text-sm leading-6">
          {isFiltered
            ? "Arama kelimesini veya kategori filtresini değiştirerek tekrar deneyebilirsin."
            : "İlk notunu oluşturarak günlük akışını ve fikirlerini kaydetmeye başlayabilirsin."}
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
