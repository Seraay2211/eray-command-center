"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OpenNotificationsButton() {
  return (
    <Button
      onClick={() =>
        window.dispatchEvent(new Event("ecc:open-notifications"))
      }
      size="sm"
      variant="ghost"
    >
      <Bell className="size-3.5" />
      Bildirim Panelini Aç
    </Button>
  );
}
