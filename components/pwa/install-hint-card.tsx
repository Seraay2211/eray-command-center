import { Download, Smartphone } from "lucide-react";

export function InstallHintCard() {
  return (
    <aside className="pwa-install-hint app-card rounded-2xl border p-4 md:hidden">
      <div className="flex items-start gap-3">
        <span className="app-primary-bg flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Smartphone className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="app-text text-sm font-semibold">
              Telefona Uygulama Gibi Ekle
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
