"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { createClient } from "@/lib/supabase/client";

interface LogoutButtonProps {
  compact?: boolean;
  onLogout?: () => void;
}

export function LogoutButton({ compact = false, onLogout }: LogoutButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const { t } = useSettings();

  async function handleLogout() {
    setIsPending(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      onLogout?.();
      router.replace("/login");
      router.refresh();
      setIsPending(false);
    }
  }

  return (
    <button
      aria-label={compact ? t("auth.logout") : undefined}
      className="flex h-10 w-full items-center justify-center gap-3 rounded-[10px] border px-3 text-xs font-medium app-border app-muted transition hover:bg-rose-500/[0.07] hover:text-rose-300 disabled:cursor-wait disabled:opacity-60"
      disabled={isPending}
      onClick={handleLogout}
      type="button"
    >
      {isPending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      <span className={compact ? "lg:hidden" : undefined}>
        {isPending ? t("auth.loggingOut") : t("auth.logout")}
      </span>
    </button>
  );
}
