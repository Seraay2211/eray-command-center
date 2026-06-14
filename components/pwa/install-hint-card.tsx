"use client";

import { useSyncExternalStore } from "react";
import { Download, Smartphone, X } from "lucide-react";

const STORAGE_KEY = "ecc-pwa-install-hint-dismissed";
const STORAGE_EVENT = "ecc-pwa-install-hint-change";

function subscribe(callback: () => void) {
  window.addEventListener(STORAGE_EVENT, callback);
  return () => window.removeEventListener(STORAGE_EVENT, callback);
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) !== "true";
}

function getServerSnapshot() {
  return false;
}

export function InstallHintCard() {
  const isVisible = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }

  if (!isVisible) {
    return null;
  }

  return (
    <aside className="pwa-install-hint app-card relative rounded-2xl border p-4 md:hidden">
      <button
        aria-label="Uygulama kurulum bilgisini kapat"
        className="app-button-ghost absolute right-2 top-2 flex size-8 items-center justify-center rounded-lg"
        onClick={dismiss}
        type="button"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3">
        <span className="app-primary-bg flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Smartphone className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="app-text text-sm font-semibold">
              Paneli telefonuna ekle
            </h2>
            <Download className="app-primary size-4 shrink-0" />
          </div>
          <p className="app-muted mt-1.5 text-xs leading-5">
            Tarayıcı menüsünden “Ana ekrana ekle” seçeneğiyle Eray Command
            Center’ı telefonunda uygulama gibi kullanabilirsin.
          </p>
        </div>
      </div>
    </aside>
  );
}
