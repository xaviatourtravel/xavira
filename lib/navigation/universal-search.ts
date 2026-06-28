import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarCheck,
  CreditCard,
  FileText,
  HelpCircle,
  Home,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Megaphone,
  MessageCircle,
  PenLine,
  Receipt,
  RefreshCw,
  Settings,
  Sparkles,
  User,
  UserPlus,
  Wallet,
  Workflow,
  Zap,
} from "lucide-react";

import type { RecentSearchEntry } from "@/lib/navigation/recent-searches.client";

/** Smart ranking groups — lower number = higher priority */
export type UniversalSearchRankGroup = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type UniversalSearchCategory =
  | "customers"
  | "communication"
  | "operational"
  | "finance"
  | "performance"
  | "documents"
  | "ai"
  | "quick_action";

export type UniversalSearchItem = {
  id: string;
  category: UniversalSearchCategory;
  rankGroup: UniversalSearchRankGroup;
  title: string;
  subtitle: string;
  href: string;
  keywords: string[];
  icon: LucideIcon;
  /** Prefix shown before title, e.g. "+" for quick create */
  titlePrefix?: string;
  /** True for slash commands like /new customer */
  isCommand?: boolean;
};

export type SearchSectionId = UniversalSearchCategory | "favorites" | "recent";

export type SearchResultSection = {
  id: SearchSectionId;
  label: string;
  items: UniversalSearchItem[];
};

export type SearchResultsView = {
  sections: SearchResultSection[];
  flatItems: UniversalSearchItem[];
  isEmptyQuery: boolean;
};

export const UNIVERSAL_SEARCH_CATEGORY_ORDER: UniversalSearchCategory[] = [
  "customers",
  "communication",
  "operational",
  "finance",
  "performance",
  "documents",
  "ai",
  "quick_action",
];

export const UNIVERSAL_SEARCH_CATEGORY_LABELS: Record<
  UniversalSearchCategory,
  string
> = {
  customers: "Customer",
  communication: "Komunikasi",
  operational: "Operasional",
  finance: "Keuangan",
  performance: "Performa",
  documents: "Dokumen",
  ai: "AI",
  quick_action: "Aksi Cepat",
};

export const UNIVERSAL_SEARCH_CATEGORY_EMOJI: Record<
  UniversalSearchCategory,
  string
> = {
  customers: "👥",
  communication: "💬",
  operational: "⚙",
  finance: "💰",
  performance: "📊",
  documents: "📄",
  ai: "🤖",
  quick_action: "⚡",
};

export const SEARCH_FAVORITES: UniversalSearchItem[] = [
  {
    id: "fav-today",
    category: "operational",
    rankGroup: 6,
    title: "Hari Ini",
    subtitle: "Prioritas dan task harian",
    href: "/today",
    keywords: ["hari ini", "today", "favorit"],
    icon: Home,
  },
  {
    id: "fav-inbox",
    category: "communication",
    rankGroup: 6,
    title: "Komunikasi",
    subtitle: "Inbox dan percakapan customer",
    href: "/inbox",
    keywords: ["komunikasi", "inbox", "chat", "favorit"],
    icon: MessageCircle,
  },
  {
    id: "fav-customer",
    category: "customers",
    rankGroup: 6,
    title: "Customer",
    subtitle: "Profil dan pipeline customer",
    href: "/leads",
    keywords: ["customer", "lead", "favorit"],
    icon: User,
  },
];

const ENTITY_ITEMS: UniversalSearchItem[] = [
  {
    id: "entity-customer-anang",
    category: "customers",
    rankGroup: 1,
    title: "Pak Anang",
    subtitle: "Customer",
    href: "/leads",
    keywords: ["anang", "pak anang", "customer", "lead"],
    icon: User,
  },
  {
    id: "entity-chat-anang",
    category: "communication",
    rankGroup: 2,
    title: "Chat WhatsApp",
    subtitle: "Belum dibalas",
    href: "/inbox",
    keywords: ["anang", "chat", "whatsapp", "belum dibalas", "komunikasi", "inbox"],
    icon: MessageCircle,
  },
  {
    id: "entity-invoice-203",
    category: "finance",
    rankGroup: 4,
    title: "Invoice INV-203",
    subtitle: "Outstanding · Keuangan",
    href: "/revenue?view=invoices",
    keywords: ["anang", "inv-203", "invoice", "203", "outstanding"],
    icon: FileText,
  },
  {
    id: "entity-booking-yunnan",
    category: "customers",
    rankGroup: 5,
    title: "Booking Yunnan 2026",
    subtitle: "Paket · Customer Anang",
    href: "/bookings",
    keywords: ["anang", "yunnan", "2026", "booking", "trip"],
    icon: CalendarCheck,
  },
  {
    id: "entity-task-today",
    category: "operational",
    rankGroup: 3,
    title: "Task Hari Ini",
    subtitle: "Prioritas operasional",
    href: "/today",
    keywords: ["task", "hari ini", "today", "prioritas", "operasional"],
    icon: ListTodo,
  },
];

const FINANCE_ITEMS: UniversalSearchItem[] = [
  {
    id: "finance-pembayaran",
    category: "finance",
    rankGroup: 6,
    title: "Pembayaran",
    subtitle: "Catat dan pantau pembayaran customer",
    href: "/revenue",
    keywords: ["payment", "pembayaran", "bayar", "finance", "keuangan"],
    icon: Wallet,
  },
  {
    id: "finance-invoice",
    category: "finance",
    rankGroup: 4,
    title: "Invoice",
    subtitle: "Invoice outstanding dan riwayat tagihan",
    href: "/revenue?view=invoices",
    keywords: ["invoice", "tagihan", "inv", "payment", "pembayaran"],
    icon: FileText,
  },
  {
    id: "finance-konfirmasi",
    category: "finance",
    rankGroup: 4,
    title: "Konfirmasi Pembayaran",
    subtitle: "Verifikasi dan konfirmasi transaksi",
    href: "/revenue",
    keywords: ["konfirmasi", "pembayaran", "payment", "verify", "confirm"],
    icon: CreditCard,
  },
  {
    id: "finance-outstanding",
    category: "finance",
    rankGroup: 4,
    title: "Outstanding",
    subtitle: "Tagihan belum lunas",
    href: "/revenue?view=invoices",
    keywords: ["outstanding", "belum lunas", "piutang", "payment", "invoice"],
    icon: Receipt,
  },
];

const QUICK_ACTION_ITEMS: UniversalSearchItem[] = [
  {
    id: "quick-customer",
    category: "quick_action",
    rankGroup: 7,
    title: "Customer",
    subtitle: "Buat customer baru",
    href: "/leads/new",
    keywords: ["buat", "new", "customer", "tambah", "lead"],
    icon: UserPlus,
    titlePrefix: "+",
  },
  {
    id: "quick-task",
    category: "quick_action",
    rankGroup: 7,
    title: "Task",
    subtitle: "Buat task operasional",
    href: "/operations/tasks/new",
    keywords: ["buat", "new", "task", "tambah"],
    icon: ListTodo,
    titlePrefix: "+",
  },
  {
    id: "quick-booking",
    category: "quick_action",
    rankGroup: 7,
    title: "Booking",
    subtitle: "Buat booking baru",
    href: "/bookings/new",
    keywords: ["buat", "new", "booking", "reservasi"],
    icon: CalendarCheck,
    titlePrefix: "+",
  },
  {
    id: "quick-invoice",
    category: "quick_action",
    rankGroup: 7,
    title: "Invoice",
    subtitle: "Catat invoice atau pembayaran",
    href: "/revenue",
    keywords: ["buat", "new", "invoice", "pembayaran", "payment"],
    icon: FileText,
    titlePrefix: "+",
  },
  {
    id: "quick-campaign",
    category: "quick_action",
    rankGroup: 7,
    title: "Campaign",
    subtitle: "Buat campaign marketing",
    href: "/campaigns/new",
    keywords: ["buat", "new", "campaign", "marketing"],
    icon: Megaphone,
    titlePrefix: "+",
  },
  {
    id: "quick-follow-up",
    category: "quick_action",
    rankGroup: 7,
    title: "Buat Follow Up",
    subtitle: "Tindak lanjuti customer",
    href: "/follow-ups",
    keywords: ["anang", "follow up", "followup", "buat", "tindak lanjut"],
    icon: RefreshCw,
  },
];

const COMMAND_ITEMS: UniversalSearchItem[] = [
  {
    id: "cmd-new-customer",
    category: "quick_action",
    rankGroup: 7,
    title: "/new customer",
    subtitle: "Buat customer baru",
    href: "/leads/new",
    keywords: ["/new customer", "new customer"],
    icon: UserPlus,
    isCommand: true,
  },
  {
    id: "cmd-new-task",
    category: "quick_action",
    rankGroup: 7,
    title: "/new task",
    subtitle: "Buat task operasional",
    href: "/operations/tasks/new",
    keywords: ["/new task", "new task"],
    icon: ListTodo,
    isCommand: true,
  },
  {
    id: "cmd-open-finance",
    category: "finance",
    rankGroup: 7,
    title: "/open finance",
    subtitle: "Buka workspace Keuangan",
    href: "/finance",
    keywords: ["/open finance", "open finance", "finance"],
    icon: Wallet,
    isCommand: true,
  },
  {
    id: "cmd-open-communication",
    category: "communication",
    rankGroup: 7,
    title: "/open communication",
    subtitle: "Buka workspace Komunikasi",
    href: "/inbox",
    keywords: ["/open communication", "open communication", "komunikasi", "inbox"],
    icon: MessageCircle,
    isCommand: true,
  },
  {
    id: "cmd-settings",
    category: "quick_action",
    rankGroup: 7,
    title: "/settings",
    subtitle: "Buka pengaturan workspace",
    href: "/settings",
    keywords: ["/settings", "settings", "pengaturan"],
    icon: Settings,
    isCommand: true,
  },
  {
    id: "cmd-profile",
    category: "quick_action",
    rankGroup: 7,
    title: "/profile",
    subtitle: "Buka profil akun",
    href: "/profile",
    keywords: ["/profile", "profile", "profil"],
    icon: User,
    isCommand: true,
  },
  {
    id: "cmd-help",
    category: "quick_action",
    rankGroup: 7,
    title: "/help",
    subtitle: "Buka pusat bantuan",
    href: "/help",
    keywords: ["/help", "help", "bantuan"],
    icon: HelpCircle,
    isCommand: true,
  },
];

const PAGE_ITEMS: UniversalSearchItem[] = [
  {
    id: "page-today",
    category: "operational",
    rankGroup: 6,
    title: "Hari Ini",
    subtitle: "Workspace operasional harian",
    href: "/today",
    keywords: ["today", "hari ini", "task", "prioritas"],
    icon: Home,
  },
  {
    id: "page-inbox",
    category: "communication",
    rankGroup: 6,
    title: "Inbox",
    subtitle: "Semua percakapan customer",
    href: "/inbox",
    keywords: ["inbox", "chat", "whatsapp", "instagram", "komunikasi"],
    icon: Inbox,
  },
  {
    id: "page-leads",
    category: "customers",
    rankGroup: 6,
    title: "Customer",
    subtitle: "Profil dan pipeline customer",
    href: "/leads",
    keywords: ["customer", "lead", "pipeline", "crm", "pelanggan"],
    icon: User,
  },
  {
    id: "page-bookings",
    category: "customers",
    rankGroup: 6,
    title: "Booking",
    subtitle: "Kelola booking customer",
    href: "/bookings",
    keywords: ["booking", "reservasi", "trip", "yunnan"],
    icon: CalendarCheck,
  },
  {
    id: "page-finance",
    category: "finance",
    rankGroup: 6,
    title: "Keuangan",
    subtitle: "Pembayaran, invoice, dan outstanding",
    href: "/finance",
    keywords: ["finance", "keuangan", "payment", "revenue"],
    icon: Wallet,
  },
  {
    id: "page-operations",
    category: "operational",
    rankGroup: 6,
    title: "Operasional",
    subtitle: "Task, follow up, dan kalender tim",
    href: "/operations",
    keywords: ["operations", "operasional", "follow up", "task"],
    icon: Workflow,
  },
  {
    id: "page-follow-ups",
    category: "operational",
    rankGroup: 6,
    title: "Follow Up",
    subtitle: "Antrian tindak lanjut customer",
    href: "/follow-ups",
    keywords: ["follow up", "followup", "tindak lanjut"],
    icon: RefreshCw,
  },
  {
    id: "page-performance",
    category: "performance",
    rankGroup: 6,
    title: "Performa",
    subtitle: "Dashboard, campaign, konten, analitik",
    href: "/performance",
    keywords: ["performance", "performa", "dashboard", "analytics"],
    icon: BarChart3,
  },
  {
    id: "page-dashboard",
    category: "performance",
    rankGroup: 6,
    title: "Dashboard",
    subtitle: "Metrik bisnis dan KPI utama",
    href: "/dashboard",
    keywords: ["dashboard", "kpi", "metrik"],
    icon: LayoutDashboard,
  },
  {
    id: "page-campaigns",
    category: "performance",
    rankGroup: 6,
    title: "Campaign",
    subtitle: "Kelola campaign marketing",
    href: "/campaigns",
    keywords: ["campaign", "marketing", "iklan"],
    icon: Megaphone,
  },
  {
    id: "page-content",
    category: "performance",
    rankGroup: 6,
    title: "Konten",
    subtitle: "Perpustakaan dan studio konten",
    href: "/content",
    keywords: ["content", "konten", "studio"],
    icon: PenLine,
  },
  {
    id: "page-knowledge",
    category: "documents",
    rankGroup: 6,
    title: "Knowledge",
    subtitle: "SOP, FAQ, dan pengetahuan tim",
    href: "/knowledge",
    keywords: ["knowledge", "sop", "faq", "dokumen", "docs"],
    icon: BookOpen,
  },
  {
    id: "page-settings",
    category: "quick_action",
    rankGroup: 6,
    title: "Pengaturan",
    subtitle: "Konfigurasi workspace",
    href: "/settings",
    keywords: ["settings", "pengaturan", "config"],
    icon: Settings,
  },
  {
    id: "page-profile",
    category: "quick_action",
    rankGroup: 6,
    title: "Profil Saya",
    subtitle: "Informasi akun pribadi",
    href: "/profile",
    keywords: ["profile", "profil", "akun"],
    icon: User,
  },
  {
    id: "page-ai",
    category: "ai",
    rankGroup: 6,
    title: "Asisten AI",
    subtitle: "Insight dan saran kontekstual",
    href: "/today",
    keywords: ["ai", "assistant", "asisten", "gpt"],
    icon: Sparkles,
  },
  {
    id: "page-ai-settings",
    category: "ai",
    rankGroup: 6,
    title: "Konfigurasi AI",
    subtitle: "Pengaturan AI workspace",
    href: "/settings",
    keywords: ["ai", "automation", "bot"],
    icon: Bot,
  },
];

export const UNIVERSAL_SEARCH_CATALOG: UniversalSearchItem[] = [
  ...ENTITY_ITEMS,
  ...FINANCE_ITEMS,
  ...QUICK_ACTION_ITEMS,
  ...COMMAND_ITEMS,
  ...PAGE_ITEMS,
];

function scoreItem(item: UniversalSearchItem, query: string): number {
  const q = query.toLowerCase();
  const title = item.title.toLowerCase();
  let score = 0;

  if (title === q) {
    score += 120;
  } else if (title.startsWith(q)) {
    score += 90;
  } else if (title.includes(q)) {
    score += 70;
  }

  for (const keyword of item.keywords) {
    const kw = keyword.toLowerCase();
    if (kw === q) {
      score += 80;
    } else if (kw.startsWith(q)) {
      score += 55;
    } else if (kw.includes(q)) {
      score += 35;
    }
  }

  if (item.subtitle.toLowerCase().includes(q)) {
    score += 25;
  }

  const categoryLabel = UNIVERSAL_SEARCH_CATEGORY_LABELS[item.category].toLowerCase();
  if (categoryLabel.includes(q)) {
    score += 20;
  }

  return score;
}

function sortItems(items: UniversalSearchItem[]): UniversalSearchItem[] {
  return [...items].sort((a, b) => {
    if (a.rankGroup !== b.rankGroup) {
      return a.rankGroup - b.rankGroup;
    }

    return a.title.localeCompare(b.title, "id");
  });
}

function dedupeItems(items: UniversalSearchItem[]): UniversalSearchItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.href}::${item.title}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function groupByCategory(items: UniversalSearchItem[]): SearchResultSection[] {
  const sections: SearchResultSection[] = [];

  for (const category of UNIVERSAL_SEARCH_CATEGORY_ORDER) {
    const categoryItems = items.filter((item) => item.category === category);
    if (categoryItems.length === 0) {
      continue;
    }

    sections.push({
      id: category,
      label: `${UNIVERSAL_SEARCH_CATEGORY_EMOJI[category]} ${UNIVERSAL_SEARCH_CATEGORY_LABELS[category]}`,
      items: categoryItems,
    });
  }

  return sections;
}

function recentToItems(recent: RecentSearchEntry[]): UniversalSearchItem[] {
  return recent.map((entry) => {
    const catalogMatch = UNIVERSAL_SEARCH_CATALOG.find(
      (item) => item.href === entry.href || item.title === entry.label,
    );

    return (
      catalogMatch ?? {
        id: entry.id,
        category: "operational",
        rankGroup: 6,
        title: entry.label,
        subtitle: "Pencarian terakhir",
        href: entry.href,
        keywords: [entry.label.toLowerCase()],
        icon: Zap,
      }
    );
  });
}

function buildEmptyQueryView(recent: RecentSearchEntry[]): SearchResultsView {
  const recentItems = recentToItems(recent);

  const sections: SearchResultSection[] = [
    {
      id: "favorites",
      label: "Favorit",
      items: SEARCH_FAVORITES,
    },
    {
      id: "recent",
      label: "Pencarian Terakhir",
      items: recentItems,
    },
  ];

  const flatItems = sections.flatMap((section) => section.items);

  return {
    sections,
    flatItems,
    isEmptyQuery: true,
  };
}

function isQuickCreateIntent(query: string) {
  const normalized = query.trim().toLowerCase();
  return normalized === "buat" || normalized.startsWith("buat ");
}

function isPaymentIntent(query: string) {
  const normalized = query.trim().toLowerCase();
  const terms = [
    "payment",
    "pembayaran",
    "invoice",
    "outstanding",
    "bayar",
    "tagihan",
    "konfirmasi",
  ];

  return terms.some(
    (term) => normalized === term || normalized.includes(term),
  );
}

function filterCommandItems(query: string): UniversalSearchItem[] {
  const normalized = query.trim().toLowerCase();

  return COMMAND_ITEMS.filter((item) => {
    const haystack = [item.title, ...item.keywords].join(" ").toLowerCase();
    return haystack.includes(normalized) || item.title.toLowerCase().startsWith(normalized);
  });
}

export function buildUniversalSearchResults(
  query: string,
  recent: RecentSearchEntry[] = [],
): SearchResultsView {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return buildEmptyQueryView(recent);
  }

  if (normalized.startsWith("/")) {
    const commands = sortItems(filterCommandItems(normalized));
    const sections: SearchResultSection[] =
      commands.length > 0
        ? [
            {
              id: "quick_action",
              label: `${UNIVERSAL_SEARCH_CATEGORY_EMOJI.quick_action} Perintah`,
              items: commands,
            },
          ]
        : [];

    return {
      sections,
      flatItems: commands,
      isEmptyQuery: false,
    };
  }

  let candidates = UNIVERSAL_SEARCH_CATALOG.filter((item) => !item.isCommand);

  if (isQuickCreateIntent(normalized)) {
    candidates = QUICK_ACTION_ITEMS.filter((item) => item.titlePrefix === "+");
  } else {
    candidates = candidates
      .map((item) => ({ item, score: scoreItem(item, normalized) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        if (a.item.rankGroup !== b.item.rankGroup) {
          return a.item.rankGroup - b.item.rankGroup;
        }

        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.item.title.localeCompare(b.item.title, "id");
      })
      .map(({ item }) => item);

    if (isPaymentIntent(normalized)) {
      const financeBoost = FINANCE_ITEMS.filter(
        (item) => !candidates.some((candidate) => candidate.id === item.id),
      );
      candidates = dedupeItems([...candidates, ...financeBoost]);
    }
  }

  const sorted = isQuickCreateIntent(normalized)
    ? sortItems(candidates)
    : dedupeItems(candidates);

  const sections = groupByCategory(sorted);

  return {
    sections,
    flatItems: sorted,
    isEmptyQuery: false,
  };
}

/** @deprecated Use buildUniversalSearchResults */
export function filterUniversalSearchItems(query: string): UniversalSearchItem[] {
  return buildUniversalSearchResults(query).flatItems;
}

export function getDisplayTitle(item: UniversalSearchItem) {
  return item.titlePrefix ? `${item.titlePrefix} ${item.title}` : item.title;
}

export function getNextSectionStartIndex(
  view: SearchResultsView,
  currentIndex: number,
): number {
  const currentItem = view.flatItems[currentIndex];
  if (!currentItem || view.sections.length <= 1) {
    return currentIndex;
  }

  let itemSectionIndex = 0;

  for (let index = 0; index < view.sections.length; index += 1) {
    const section = view.sections[index]!;
    if (section.items.some((item) => item.id === currentItem.id)) {
      itemSectionIndex = index;
      break;
    }
  }

  const nextSection = view.sections[(itemSectionIndex + 1) % view.sections.length]!;
  const nextIndex = view.flatItems.findIndex((item) => item.id === nextSection.items[0]?.id);

  return nextIndex >= 0 ? nextIndex : 0;
}
