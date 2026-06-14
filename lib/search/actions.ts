import type { SearchResult } from "@/types";

export const QUICK_ACTIONS: SearchResult[] = [
  {
    id: "action-new-note",
    type: "action",
    title: "Yeni Not Oluştur",
    description: "Notlar ekranında yeni kayıt oluşturma panelini açar.",
    href: "/notes?new=1",
    meta: "Hızlı aksiyon",
  },
  {
    id: "action-quick-capture",
    type: "action",
    title: "Hızlı Kayıt",
    description: "Hızlı Kayıtlar alanı için hızlı not yakalama penceresini açar.",
    href: "/notes?quick=1",
    meta: "Hızlı aksiyon",
  },
  {
    id: "action-new-task",
    type: "action",
    title: "Yeni Görev Oluştur",
    description: "Görev formunu doğrudan açar.",
    href: "/tasks?new=1",
    meta: "Hızlı aksiyon",
  },
  {
    id: "action-daily-report",
    type: "action",
    title: "Günlük Rapor Hazırla",
    description: "AI destekli günlük rapor akışına gider.",
    href: "/reports?new=ai&type=daily",
    meta: "Hızlı aksiyon",
  },
  {
    id: "action-ai",
    type: "action",
    title: "AI Asistan Aç",
    description: "Metin işleme ve AI yardım ekranını açar.",
    href: "/ai",
    meta: "Hızlı aksiyon",
  },
  {
    id: "action-new-plan",
    type: "action",
    title: "Yeni Plan Oluştur",
    description: "Takvim ekranında yeni plan formunu açar.",
    href: "/calendar?new=1",
    meta: "Hızlı aksiyon",
  },
  {
    id: "action-settings",
    type: "action",
    title: "Ayarları Aç",
    description: "Tercihler, tema ve sistem ayarlarına gider.",
    href: "/settings",
    meta: "Hızlı aksiyon",
  },
  {
    id: "action-finance",
    type: "action",
    title: "Finans Paneli",
    description: "Borç, ödeme ve yaklaşan vadeleri yönetir.",
    href: "/finance",
    meta: "Hızlı aksiyon",
  },
  {
    id: "action-new-debt",
    type: "action",
    title: "Yeni Borç",
    description: "Finans merkezinde yeni borç kaydı oluşturur.",
    href: "/finance?new=1",
    meta: "Hızlı aksiyon",
  },
  {
    id: "action-add-payment",
    type: "action",
    title: "Ödeme Ekle",
    description: "Finans merkezini açarak borca ödeme kaydı ekler.",
    href: "/finance",
    meta: "Hızlı aksiyon",
  },
  {
    id: "action-finance-summary",
    type: "action",
    title: "Finans Özeti Oluştur",
    description: "Gemini veya demo moduyla kişisel finans özeti üretir.",
    href: "/finance?action=summary",
    meta: "AI aksiyonu",
  },
  {
    id: "action-templates",
    type: "action",
    title: "Şablonlar",
    description: "Hazır formatları ve sistem şablonlarını yönetir.",
    href: "/templates",
    meta: "Hızlı aksiyon",
  },
  {
    id: "action-new-template",
    type: "action",
    title: "Yeni Şablon",
    description: "Sıfırdan yeni çalışma şablonu oluşturur.",
    href: "/templates?new=1",
    meta: "Hızlı aksiyon",
  },
  {
    id: "action-note-from-template",
    type: "action",
    title: "Şablondan Not Oluştur",
    description: "Not editörünü açıp şablon seçmeye hazırlar.",
    href: "/notes?editor=new&templatePicker=1",
    meta: "Hızlı aksiyon",
  },
  {
    id: "action-dashboard",
    type: "action",
    title: "Dashboard'a Git",
    description: "Genel bakış ekranını açar.",
    href: "/dashboard",
    meta: "Hızlı aksiyon",
  },
];

export function filterQuickActions(query: string): SearchResult[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");

  if (!normalizedQuery) {
    return QUICK_ACTIONS;
  }

  return QUICK_ACTIONS.filter((action) => {
    const haystack = [
      action.title,
      action.description ?? "",
      action.meta ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase("tr-TR");

    return haystack.includes(normalizedQuery);
  });
}
