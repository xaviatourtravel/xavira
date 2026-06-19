import {
  Bell,
  Bot,
  Building2,
  Inbox,
  Plug,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

export const SETTINGS_SECTIONS = [
  {
    id: "general",
    label: "General",
    description: "Company profile and workspace defaults",
    icon: Building2,
  },
  {
    id: "team",
    label: "Team",
    description: "Members, invites, and access",
    icon: Users,
  },
  {
    id: "roles",
    label: "Roles & Permissions",
    description: "Role capabilities across Desklabs",
    icon: Shield,
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Connected channels and services",
    icon: Plug,
  },
  {
    id: "ai",
    label: "AI Settings",
    description: "Assist modes and response tone",
    icon: Bot,
  },
  {
    id: "inbox",
    label: "Inbox Settings",
    description: "Routing, hours, and auto-replies",
    icon: Inbox,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Alerts for leads, inbox, and bookings",
    icon: Bell,
  },
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]["id"];

export const SETTINGS_SECTION_IDS = SETTINGS_SECTIONS.map(
  (section) => section.id,
) as SettingsSectionId[];

export function isSettingsSectionId(value: string): value is SettingsSectionId {
  return SETTINGS_SECTION_IDS.includes(value as SettingsSectionId);
}

export function getSettingsSectionIcon(
  sectionId: SettingsSectionId,
): LucideIcon {
  return SETTINGS_SECTIONS.find((section) => section.id === sectionId)!.icon;
}

export const PERMISSION_MATRIX_ROLES = [
  "Owner",
  "Admin",
  "Sales",
  "Marketing",
  "Finance",
] as const;

export const PERMISSION_MATRIX_FEATURES = [
  { key: "dashboard", label: "Owner dashboard & revenue" },
  { key: "leads", label: "Lead management" },
  { key: "inbox", label: "Omnichannel inbox" },
  { key: "bookings", label: "Bookings & payments" },
  { key: "content", label: "Content studio" },
  { key: "integrations", label: "Manage integrations" },
  { key: "team", label: "Team & role management" },
  { key: "settings", label: "Workspace settings" },
] as const;

export type PermissionLevel = "full" | "limited" | "view" | "none" | "planned";

export const PERMISSION_MATRIX: Record<
  (typeof PERMISSION_MATRIX_ROLES)[number],
  Record<(typeof PERMISSION_MATRIX_FEATURES)[number]["key"], PermissionLevel>
> = {
  Owner: {
    dashboard: "full",
    leads: "full",
    inbox: "full",
    bookings: "full",
    content: "full",
    integrations: "full",
    team: "full",
    settings: "full",
  },
  Admin: {
    dashboard: "full",
    leads: "full",
    inbox: "full",
    bookings: "full",
    content: "full",
    integrations: "full",
    team: "full",
    settings: "full",
  },
  Sales: {
    dashboard: "limited",
    leads: "full",
    inbox: "full",
    bookings: "limited",
    content: "view",
    integrations: "view",
    team: "view",
    settings: "view",
  },
  Marketing: {
    dashboard: "view",
    leads: "view",
    inbox: "view",
    bookings: "view",
    content: "full",
    integrations: "planned",
    team: "view",
    settings: "view",
  },
  Finance: {
    dashboard: "view",
    leads: "view",
    inbox: "view",
    bookings: "full",
    content: "view",
    integrations: "view",
    team: "view",
    settings: "view",
  },
};

export const PERMISSION_LEVEL_LABELS: Record<PermissionLevel, string> = {
  full: "Full access",
  limited: "Limited",
  view: "View only",
  none: "No access",
  planned: "Coming soon",
};
