import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bot,
  CalendarCheck,
  Inbox,
  ListTodo,
  Receipt,
  Users,
} from "lucide-react";

export type UniversalSearchCategory =
  | "customers"
  | "bookings"
  | "invoices"
  | "tasks"
  | "chats"
  | "knowledge"
  | "ai";

export type UniversalSearchItem = {
  id: string;
  category: UniversalSearchCategory;
  title: string;
  subtitle: string;
  href: string;
  keywords: string[];
  icon: LucideIcon;
};

/** Static navigation + future global search seeds */
export const UNIVERSAL_SEARCH_ITEMS: UniversalSearchItem[] = [
  {
    id: "nav-today",
    category: "tasks",
    title: "Hari Ini",
    subtitle: "Workspace operasional harian",
    href: "/today",
    keywords: ["today", "hari ini", "tasks", "prioritas"],
    icon: ListTodo,
  },
  {
    id: "nav-inbox",
    category: "chats",
    title: "Inbox",
    subtitle: "Semua percakapan customer",
    href: "/inbox",
    keywords: ["inbox", "chat", "whatsapp", "instagram", "komunikasi"],
    icon: Inbox,
  },
  {
    id: "nav-leads",
    category: "customers",
    title: "Customer",
    subtitle: "Profil dan pipeline customer",
    href: "/leads",
    keywords: ["customer", "lead", "pipeline", "crm"],
    icon: Users,
  },
  {
    id: "nav-bookings",
    category: "bookings",
    title: "Bookings",
    subtitle: "Kelola booking customer",
    href: "/bookings",
    keywords: ["booking", "reservasi", "trip"],
    icon: CalendarCheck,
  },
  {
    id: "nav-finance",
    category: "invoices",
    title: "Keuangan",
    subtitle: "Pembayaran, invoice, dan outstanding",
    href: "/finance",
    keywords: ["payment", "invoice", "revenue", "keuangan", "finance"],
    icon: Receipt,
  },
  {
    id: "nav-operations",
    category: "tasks",
    title: "Operasional",
    subtitle: "Task, follow up, dan kalender tim",
    href: "/operations",
    keywords: ["operations", "operasional", "follow up", "task", "calendar"],
    icon: ListTodo,
  },
  {
    id: "nav-performance",
    category: "tasks",
    title: "Performance",
    subtitle: "Dashboard, campaign, content, analytics",
    href: "/performance",
    keywords: ["performance", "dashboard", "campaign", "analytics"],
    icon: ListTodo,
  },
  {
    id: "nav-knowledge",
    category: "knowledge",
    title: "Knowledge Layer",
    subtitle: "SOP, FAQ, dan pengetahuan tim",
    href: "/knowledge",
    keywords: ["knowledge", "sop", "faq", "docs", "layer"],
    icon: BookOpen,
  },
  {
    id: "nav-ai-settings",
    category: "ai",
    title: "AI Layer",
    subtitle: "Konfigurasi AI workspace",
    href: "/settings",
    keywords: ["ai", "assistant", "automation", "gpt", "layer"],
    icon: Bot,
  },
];

export const UNIVERSAL_SEARCH_CATEGORY_LABELS: Record<
  UniversalSearchCategory,
  string
> = {
  customers: "Customer",
  bookings: "Bookings",
  invoices: "Keuangan",
  tasks: "Operasional",
  chats: "Komunikasi",
  knowledge: "Knowledge Layer",
  ai: "AI Layer",
};

export function filterUniversalSearchItems(query: string): UniversalSearchItem[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return UNIVERSAL_SEARCH_ITEMS;
  }

  return UNIVERSAL_SEARCH_ITEMS.filter((item) => {
    const haystack = [
      item.title,
      item.subtitle,
      ...item.keywords,
      UNIVERSAL_SEARCH_CATEGORY_LABELS[item.category],
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}
