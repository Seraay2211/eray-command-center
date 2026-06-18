"use client";

import type { LucideIcon } from "lucide-react";
import { DarkSelect } from "@/components/ui/dark-select";
import { cn } from "@/lib/utils";

export interface SettingsTab {
  group?: string;
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
  const groups = tabs.reduce<Array<{ label: string; tabs: SettingsTab[] }>>(
    (items, tab) => {
      const groupLabel = tab.group ?? "Ayarlar";
      const group = items.find((item) => item.label === groupLabel);

      if (group) {
        group.tabs.push(tab);
      } else {
        items.push({ label: groupLabel, tabs: [tab] });
      }

      return items;
    },
    [],
  );

  return (
    <>
      <div className="min-w-0 max-w-full lg:hidden">
        <DarkSelect
          ariaLabel="Ayarlar bölümü"
          onChange={onChange}
          options={tabs.map((tab) => ({
            label: tab.group ? `${tab.group} · ${tab.label}` : tab.label,
            value: tab.id,
          }))}
          value={activeTab}
        />
      </div>
      <nav
        aria-label="Ayarlar menüsü"
        className="app-card sticky top-20 hidden min-w-0 rounded-2xl border p-2 lg:block"
      >
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="app-muted mb-1.5 px-2.5 text-[9px] font-semibold uppercase tracking-[0.18em]">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "app-settings-nav-row flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[11px] font-medium transition",
                        isActive
                          ? "bg-[color-mix(in_srgb,var(--primary)_13%,var(--surface-2))] app-text shadow-sm"
                          : "app-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                      )}
                      key={tab.id}
                      onClick={() => onChange(tab.id)}
                      type="button"
                    >
                      <Icon
                        className={cn("size-4 shrink-0", isActive && "app-primary")}
                      />
                      <span className="min-w-0 truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
