import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";
import { RouteStatus } from "@/components/ui/route-status";

export default function NotFound() {
  return (
    <RouteStatus
      action={
        <Link
          className={buttonClassName()}
          href="/"
        >
          Ana sayfaya dön
        </Link>
      }
      description="Aradığın sayfa taşınmış, silinmiş veya hiç oluşturulmamış olabilir."
      icon={FileQuestion}
      title="Sayfa bulunamadı."
    />
  );
}
