export const PERMISSIONS = [
  "today.view",
  "dashboard.view",
  "leads.view",
  "leads.create",
  "leads.edit",
  "leads.delete",
  "inbox.view",
  "inbox.reply",
  "inbox.assign",
  "inbox.convert_to_lead",
  "followups.view",
  "followups.create",
  "bookings.view",
  "bookings.create",
  "bookings.edit",
  "payments.view",
  "payments.create",
  "content.view",
  "content.manage",
  "knowledge.view",
  "knowledge.manage",
  "settings.view",
  "settings.manage",
  "team.manage",
  "integrations.manage",
  "ai_settings.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type EffectiveRole =
  | "owner"
  | "admin"
  | "sales"
  | "marketing"
  | "finance";

export const EFFECTIVE_ROLES: EffectiveRole[] = [
  "owner",
  "admin",
  "sales",
  "marketing",
  "finance",
];

const ALL_PERMISSIONS = new Set<Permission>(PERMISSIONS);

function permissionsOf(values: Permission[]) {
  return new Set<Permission>(values);
}

export const ROLE_PERMISSIONS: Record<EffectiveRole, ReadonlySet<Permission>> = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  sales: permissionsOf([
    "today.view",
    "dashboard.view",
    "leads.view",
    "leads.create",
    "leads.edit",
    "inbox.view",
    "inbox.reply",
    "inbox.convert_to_lead",
    "followups.view",
    "followups.create",
    "bookings.view",
    "bookings.create",
    "payments.view",
  ]),
  marketing: permissionsOf([
    "dashboard.view",
    "inbox.view",
    "content.view",
    "content.manage",
    "knowledge.view",
  ]),
  finance: permissionsOf([
    "today.view",
    "dashboard.view",
    "bookings.view",
    "payments.view",
    "payments.create",
    "leads.view",
  ]),
};

export function normalizeEffectiveRole(role: string): EffectiveRole {
  switch (role) {
    case "owner":
      return "owner";
    case "admin":
      return "admin";
    case "sales":
    case "agent":
      return "sales";
    case "marketing":
      return "marketing";
    case "finance":
      return "finance";
    default:
      return "sales";
  }
}

export function formatEffectiveRoleLabel(role: EffectiveRole | string) {
  switch (normalizeEffectiveRole(role)) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "sales":
      return "Sales";
    case "marketing":
      return "Marketing";
    case "finance":
      return "Finance";
    default:
      return role;
  }
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  "today.view": "View today workspace",
  "dashboard.view": "View dashboard",
  "leads.view": "View leads",
  "leads.create": "Create leads",
  "leads.edit": "Edit leads",
  "leads.delete": "Delete leads",
  "inbox.view": "View inbox",
  "inbox.reply": "Reply in inbox",
  "inbox.assign": "Assign inbox conversations",
  "inbox.convert_to_lead": "Convert inbox to lead",
  "followups.view": "View follow-ups",
  "followups.create": "Create follow-ups",
  "bookings.view": "View bookings",
  "bookings.create": "Create bookings",
  "bookings.edit": "Edit bookings",
  "payments.view": "View payments",
  "payments.create": "Record payments",
  "content.view": "View content",
  "content.manage": "Manage content",
  "knowledge.view": "View knowledge hub",
  "knowledge.manage": "Manage knowledge hub",
  "settings.view": "View settings",
  "settings.manage": "Manage workspace settings",
  "team.manage": "Manage team",
  "integrations.manage": "Manage integrations",
  "ai_settings.manage": "Manage AI settings",
};

export const PERMISSION_GROUPS = [
  {
    id: "dashboard",
    label: "Dashboard",
    permissions: ["today.view", "dashboard.view"] as Permission[],
  },
  {
    id: "leads",
    label: "Leads",
    permissions: [
      "leads.view",
      "leads.create",
      "leads.edit",
      "leads.delete",
    ] as Permission[],
  },
  {
    id: "inbox",
    label: "Inbox",
    permissions: [
      "inbox.view",
      "inbox.reply",
      "inbox.assign",
      "inbox.convert_to_lead",
    ] as Permission[],
  },
  {
    id: "followups",
    label: "Follow-ups",
    permissions: ["followups.view", "followups.create"] as Permission[],
  },
  {
    id: "bookings",
    label: "Bookings & payments",
    permissions: [
      "bookings.view",
      "bookings.create",
      "bookings.edit",
      "payments.view",
      "payments.create",
    ] as Permission[],
  },
  {
    id: "content",
    label: "Content",
    permissions: ["content.view", "content.manage"] as Permission[],
  },
  {
    id: "knowledge",
    label: "Knowledge",
    permissions: ["knowledge.view", "knowledge.manage"] as Permission[],
  },
  {
    id: "settings",
    label: "Settings & admin",
    permissions: [
      "settings.view",
      "settings.manage",
      "team.manage",
      "integrations.manage",
      "ai_settings.manage",
    ] as Permission[],
  },
] as const;

export function roleHasPermission(
  role: string,
  permission: Permission,
): boolean {
  const effectiveRole = normalizeEffectiveRole(role);
  return ROLE_PERMISSIONS[effectiveRole].has(permission);
}

export function getPermissionsForRole(role: string): Permission[] {
  const effectiveRole = normalizeEffectiveRole(role);
  return PERMISSIONS.filter((permission) =>
    ROLE_PERMISSIONS[effectiveRole].has(permission),
  );
}
