import { LoaderCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function TodayLoading() {
  return (
    <Card className="flex min-h-64 items-center justify-center p-8">
      <div className="text-center">
        <LoaderCircle className="app-primary mx-auto size-7 animate-spin" />
        <p className="app-muted mt-3 text-sm">Bugün verileri yükleniyor...</p>
      </div>
    </Card>
  );
}
