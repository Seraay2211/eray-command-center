"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";
import { useSettings } from "@/components/providers/settings-provider";
import { createClient } from "@/lib/supabase/client";

interface LogoutButtonProps {
  onLogout?: () => void;
}

export function LogoutButton({ onLogout }: LogoutButtonProps) {
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
      className="mt-2 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-xs font-medium text-zinc-600 transition hover:bg-rose-500/[0.07] hover:text-rose-300 disabled:cursor-wait disabled:opacity-60"
      disabled={isPending}
      onClick={handleLogout}
      type="button"
    >
      {isPending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      {isPending ? t("auth.loggingOut") : t("auth.logout")}
    </button>
  );
}
