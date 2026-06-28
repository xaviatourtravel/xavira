import type { LucideIcon } from "lucide-react";
import {
  CalendarPlus,
  CreditCard,
  ListTodo,
  Megaphone,
  Package,
  UserPlus,
} from "lucide-react";

export type QuickCreateItemStatus = "available" | "coming_soon";

export type QuickCreateItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status: QuickCreateItemStatus;
};

export const QUICK_CREATE_ITEMS: QuickCreateItem[] = [
  {
    id: "customer",
    label: "Customer",
    description: "Tambahkan customer baru.",
    href: "/leads/new",
    icon: UserPlus,
    status: "available",
  },
  {
    id: "task",
    label: "Task",
    description: "Buat task operasional.",
    href: "/operations/tasks/new",
    icon: ListTodo,
    status: "coming_soon",
  },
  {
    id: "booking",
    label: "Booking",
    description: "Buat booking baru.",
    href: "/bookings/new",
    icon: CalendarPlus,
    status: "coming_soon",
  },
  {
    id: "payment",
    label: "Pembayaran",
    description: "Catat pembayaran customer.",
    href: "/revenue",
    icon: CreditCard,
    status: "available",
  },
  {
    id: "package",
    label: "Package",
    description: "Buat produk atau paket baru.",
    href: "/packages/new",
    icon: Package,
    status: "available",
  },
  {
    id: "campaign",
    label: "Campaign",
    description: "Buat campaign marketing.",
    href: "/campaigns/new",
    icon: Megaphone,
    status: "available",
  },
];
