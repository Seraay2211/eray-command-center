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
      <div className="lg:hidden">
        <DarkSelect
          ariaLabel="Ayarlar bölümü"
          onChange={onChange}
          options={tabs.map((tab) => ({ label: tab.label, value: tab.id }))}
          value={activeTab}
        />
      </div>
      <nav
        aria-label="Ayarlar menüsü"
        className="app-card hidden rounded-[14px] border p-1.5 lg:block"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "app-settings-nav-row flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-xs font-medium transition",
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
