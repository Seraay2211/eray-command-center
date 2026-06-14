import { RouteStatus } from "@/components/ui/route-status";

export default function GlobalLoading() {
  return (
    <RouteStatus
      description="Çalışma alanın güvenli şekilde hazırlanıyor."
      title="Yükleniyor..."
    />
  );
}
