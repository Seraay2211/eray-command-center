"use client";

import type { LucideIcon } from "lucide-react";
import { DarkSelect } from "@/components/ui/dark-select";
import { cn } from "@/lib/utils";

export interface SettingsTab {
  icon: LucideIcon;
  id: string;
  label: string;
}

interface SettingsSidebarProps {
  activeTab: string;
  onChange: (tab: string) => void;
  tabs: SettingsTab[];
}

export function SettingsSidebar({
  activeTab,
  onChange,
  tabs,
}: SettingsSidebarProps) {
  return (
    <>
      <div className="min-w-0 max-w-full lg:hidden">
        <DarkSelect
          ariaLabel="Ayarlar bölümü"
          onChange={onChange}
          options={tabs.map((tab) => ({ label: tab.label, value: tab.id }))}
          value={activeTab}
        />
      </div>
      <nav
        aria-label="Ayarlar menüsü"
        className="app-card sticky top-20 hidden min-w-0 rounded-xl border p-1 lg:block"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "app-settings-nav-row flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium transition",
                isActive
                  ? "bg-[color-mix(in_srgb,var(--primary)_12%,var(--surface-2))] app-text"
                  : "app-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
              )}
              key={tab.id}
              onClick={() => onChange(tab.id)}
              type="button"
            >
              <Icon className={cn("size-4", isActive && "app-primary")} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
