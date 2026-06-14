import type { AppLanguage } from "@/types";

const dictionaries = {
  tr: {
    "nav.workspace": "Çalışma alanı",
    "nav.dashboard": "Dashboard",
    "nav.notes": "Notlar",
    "nav.tasks": "Görevler",
    "nav.calendar": "Takvim",
    "nav.reports": "Raporlar",
    "nav.ai": "AI Asistan",
    "nav.settings": "Ayarlar",
    "topbar.search": "Notlarda ara...",
    "topbar.newNote": "Yeni Not",
    "topbar.notifications": "Bildirimler",
    "auth.logout": "Çıkış Yap",
    "auth.loggingOut": "Çıkış yapılıyor...",
    "settings.title": "Ayarlar",
    "settings.description":
      "Eray Command Center deneyimini kişisel çalışma tarzına göre düzenle.",
    "common.save": "Kaydet",
    "common.cancel": "İptal",
    "common.close": "Kapat",
    "common.reset": "Sıfırla",
  },
  en: {
    "nav.workspace": "Workspace",
    "nav.dashboard": "Dashboard",
    "nav.notes": "Notes",
    "nav.tasks": "Tasks",
    "nav.calendar": "Calendar",
    "nav.reports": "Reports",
    "nav.ai": "AI Assistant",
    "nav.settings": "Settings",
    "topbar.search": "Search notes...",
    "topbar.newNote": "New Note",
    "topbar.notifications": "Notifications",
    "auth.logout": "Sign Out",
    "auth.loggingOut": "Signing out...",
    "settings.title": "Settings",
    "settings.description":
      "Shape Eray Command Center around your personal workflow.",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.reset": "Reset",
  },
} as const;

export type DictionaryKey = keyof (typeof dictionaries)["tr"];

export function translate(language: AppLanguage, key: DictionaryKey): string {
  return dictionaries[language][key] ?? dictionaries.tr[key];
}
