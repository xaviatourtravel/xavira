import {
  Bell,
  Bot,
  Building2,
  Inbox,
  Plug,
  ScrollText,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  EFFECTIVE_ROLES,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  roleHasPermission,
  type EffectiveRole,
  type Permission,
} from "@/lib/auth/permission-matrix";

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
  {
    id: "audit",
    label: "Audit Logs",
    description: "Monitor team activity and changes",
    icon: ScrollText,
    requiresAdminOrOwner: true,
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

export const PERMISSION_MATRIX_ROLES = EFFECTIVE_ROLES.map((role) =>
  role.charAt(0).toUpperCase() + role.slice(1),
) as Array<Capitalize<EffectiveRole>>;

export const PERMISSION_MATRIX_FEATURES = PERMISSION_GROUPS.map((group) => ({
  key: group.id,
  label: group.label,
  permissions: group.permissions,
}));

export type PermissionLevel = "allowed" | "denied";

export const PERMISSION_MATRIX: Record<
  Capitalize<EffectiveRole>,
  Record<(typeof PERMISSION_MATRIX_FEATURES)[number]["key"], PermissionLevel>
> = Object.fromEntries(
  EFFECTIVE_ROLES.map((role) => {
    const displayRole = (role.charAt(0).toUpperCase() +
      role.slice(1)) as Capitalize<EffectiveRole>;

    const featureMap = Object.fromEntries(
      PERMISSION_GROUPS.map((group) => {
        const allowed = group.permissions.some((permission) =>
          roleHasPermission(role, permission),
        );
        return [group.id, allowed ? "allowed" : "denied"] as const;
      }),
    ) as Record<
      (typeof PERMISSION_MATRIX_FEATURES)[number]["key"],
      PermissionLevel
    >;

    return [displayRole, featureMap];
  }),
) as Record<
  Capitalize<EffectiveRole>,
  Record<(typeof PERMISSION_MATRIX_FEATURES)[number]["key"], PermissionLevel>
>;

export const PERMISSION_LEVEL_LABELS: Record<PermissionLevel, string> = {
  allowed: "Allowed",
  denied: "No access",
};

export const PERMISSION_MATRIX_DETAIL_ROWS = PERMISSION_GROUPS.flatMap(
  (group) =>
    group.permissions.map((permission) => ({
      group: group.label,
      permission,
      label: PERMISSION_LABELS[permission],
    })),
);

export type { Permission };
