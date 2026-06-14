import {
  BarChart3,
  Bot,
  CalendarDays,
  CheckSquare2,
  Gauge,
  LibraryBig,
  LayoutDashboard,
  MessageSquareText,
  NotebookPen,
  Settings,
  Sparkles,
  Sunrise,
  Tags,
  WalletCards,
  WandSparkles,
  Zap,
} from "lucide-react";
import type { NavItem, QuickAction } from "@/types";

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Bugün", href: "/today", icon: Sunrise },
  { label: "Notlar", href: "/notes", icon: NotebookPen },
  { label: "Görevler", href: "/tasks", icon: CheckSquare2 },
  { label: "Takvim", href: "/calendar", icon: CalendarDays },
  { label: "Finans", href: "/finance", icon: WalletCards },
  { label: "Raporlar", href: "/reports", icon: BarChart3 },
  { label: "Şablonlar", href: "/templates", icon: LibraryBig },
  { label: "Düzen", href: "/taxonomy", icon: Tags },
  { label: "AI Asistan", href: "/ai", icon: Bot },
  { label: "Ayarlar", href: "/settings", icon: Settings },
];

export const quickActions: QuickAction[] = [
  {
    title: "Yeni Not Oluştur",
    description: "Düşünceni hızlıca çalışma alanına kaydet.",
    icon: NotebookPen,
    accent: "violet",
    href: "/notes?new=1",
  },
  {
    title: "Yeni Plan Aç",
    description: "Bugün veya hafta için yeni bir plan kaydı ekle.",
    icon: CalendarDays,
    accent: "emerald",
    href: "/calendar?new=1",
    statusLabel: "Yeni",
  },
  {
    title: "Günlük Rapor Hazırla",
    description: "Bugünün ilerlemesini tek raporda toparla.",
    icon: BarChart3,
    accent: "blue",
    href: "/reports?new=ai&type=daily",
    statusLabel: "Hazır",
  },
  {
    title: "Metni Premium Hale Getir",
    description: "Yazını daha profesyonel ve güçlü biçime taşı.",
    icon: WandSparkles,
    accent: "amber",
    href: "/ai?action=premium",
    statusLabel: "Hazır",
  },
  {
    title: "Günlük Planı Aç",
    description: "Takvimde bugünün akışına hızlıca dön.",
    icon: CalendarDays,
    accent: "violet",
    href: "/calendar",
  },
  {
    title: "Kısa ve Vurucu Yap",
    description: "Mesajını özünü koruyarak sadeleştir.",
    icon: Zap,
    accent: "emerald",
    href: "/ai?action=shorten",
    statusLabel: "Hazır",
  },
];

export const aiCommands = [
  { label: "Bugünü Özetle", icon: MessageSquareText, href: "/ai?action=summarize" },
  { label: "Öncelikleri çıkar", icon: Gauge, href: "/ai?action=shorten" },
  { label: "Yönetici raporu yaz", icon: Sparkles, href: "/ai?action=manager_report" },
];
