import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";

export const dashboardNav = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Leads",
    href: "/leads",
    icon: Users,
  },
  {
    title: "Follow Ups",
    href: "/follow-ups",
    icon: MessageSquare,
  },
  {
    title: "Campaigns",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    title: "Content",
    href: "/content",
    icon: FileText,
  },
  {
    title: "Scripts",
    href: "/scripts",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
] as const;
