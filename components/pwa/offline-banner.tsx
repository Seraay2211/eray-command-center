"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (isOnline) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-3 top-[calc(4.75rem+env(safe-area-inset-top))] z-[90] mx-auto max-w-xl"
      role="status"
    >
      <div className="app-card app-border pointer-events-auto flex items-start gap-3 rounded-2xl border p-3 shadow-2xl">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--warning)_20%,var(--surface))] text-[var(--warning)]">
          <WifiOff className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="app-text text-sm font-semibold">Bağlantı yok</p>
          <p className="app-muted mt-1 text-xs leading-5">
            İnternet geri geldiğinde verilerin tekrar güncellenecek. Kayıt
            gerektiren işlemler için bağlantı gerekiyor.
          </p>
        </div>
      </div>
    </div>
  );
}
