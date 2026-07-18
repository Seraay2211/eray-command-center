"use client";

import { useState, useSyncExternalStore } from "react";
import { ChevronDown, Download, Smartphone, X } from "lucide-react";
import { useStandaloneMode } from "@/hooks/use-standalone-mode";

const HIDDEN_STORAGE_KEY = "ecc-ios-install-guide-hidden";
const LATER_SESSION_KEY = "ecc-ios-install-guide-later";
const STORAGE_EVENT = "ecc-ios-install-guide-change";

function subscribe(callback: () => void) {
  window.addEventListener(STORAGE_EVENT, callback);
  return () => window.removeEventListener(STORAGE_EVENT, callback);
}

function getSnapshot() {
  return (
    localStorage.getItem(HIDDEN_STORAGE_KEY) === "true" ||
    sessionStorage.getItem(LATER_SESSION_KEY) === "true"
  );
}

function getServerSnapshot() {
  return true;
}

export function InstallHintCard() {
  const { hasMounted, isIosSafari, isStandalone } = useStandaloneMode();
  const isHidden = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [showSteps, setShowSteps] = useState(false);

  function hideForNow() {
    sessionStorage.setItem(LATER_SESSION_KEY, "true");
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }

  function hideForever() {
    localStorage.setItem(HIDDEN_STORAGE_KEY, "true");
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }

  if (!hasMounted || !isIosSafari || isStandalone || isHidden) {
    return null;
  }

  return (
    <aside className="pwa-install-hint app-card relative rounded-2xl border p-4 md:hidden">
      <button
        aria-label="Kurulum bilgisini kapat"
        className="app-button-ghost absolute right-2 top-2 flex size-8 items-center justify-center rounded-lg"
        onClick={hideForNow}
        type="button"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-start gap-3">
        <span className="app-primary-bg flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Smartphone className="size-5" />
        </span>
        <div className="min-w-0 pr-7">
          <div className="flex items-center gap-2">
            <h2 className="app-text text-sm font-semibold">
              Eray Command Center’ı iPhone’una Ekle
            </h2>
            <Download className="app-primary size-4 shrink-0" />
          </div>
          <p className="app-muted mt-1.5 text-xs leading-5">
            Ana ekrana ekleyerek uygulamayı tam ekran ve daha hızlı erişimle
            kullanabilirsin.
          </p>
        </div>
      </div>

      {showSteps ? (
        <ol className="app-surface-2 app-border mt-4 grid gap-2 rounded-2xl border p-3 text-xs leading-5">
          <li>1. Safari’de paylaş simgesine dokun.</li>
          <li>2. Ana Ekrana Ekle seçeneğini aç.</li>
          <li>3. Ekle diyerek uygulamayı ana ekranına kaydet.</li>
        </ol>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          className="app-button-primary flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold"
          onClick={() => setShowSteps((value) => !value)}
          type="button"
        >
          Nasıl Eklenir?
          <ChevronDown
            className={`size-4 transition ${showSteps ? "rotate-180" : ""}`}
          />
        </button>
        <button
          className="app-button-secondary min-h-11 rounded-xl px-3 text-xs font-semibold"
          onClick={hideForNow}
          type="button"
        >
          Şimdi Değil
        </button>
        <button
          className="app-button-ghost min-h-11 rounded-xl px-3 text-xs font-semibold"
          onClick={hideForever}
          type="button"
        >
          Bir Daha Gösterme
        </button>
      </div>
    </aside>
  );
}
