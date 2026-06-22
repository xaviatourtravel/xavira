import type { AuditLogRow, AuditModule } from "./types";

export const AUDIT_MODULE_LABELS: Record<AuditModule, string> = {
  inbox: "Inbox",
  leads: "Leads",
  follow_ups: "Follow Ups",
  bookings: "Bookings",
  payments: "Payments",
  settings: "Settings",
  integrations: "Integrations",
};

export function isAuditModule(value: string): value is AuditModule {
  return value in AUDIT_MODULE_LABELS;
}

export function getAuditModule(log: Pick<AuditLogRow, "action" | "entity_type">): AuditModule {
  if (log.action === "follow_up_created") {
    return "follow_ups";
  }

  if (log.entity_type === "inbox") {
    return "inbox";
  }

  if (log.entity_type === "lead") {
    return "leads";
  }

  if (log.entity_type === "booking") {
    return "bookings";
  }

  if (log.entity_type === "payment") {
    return "payments";
  }

  if (log.entity_type === "integration") {
    return "integrations";
  }

  if (log.entity_type === "package") {
    return "settings";
  }

  if (log.entity_type === "settings" || log.entity_type === "team") {
    return "settings";
  }

  return "settings";
}

export function formatAuditModuleLabel(module: AuditModule | string) {
  if (isAuditModule(module)) {
    return AUDIT_MODULE_LABELS[module];
  }

  return module.replace(/_/g, " ");
}

export function getModuleFilterActions(module: AuditModule): string[] | null {
  switch (module) {
    case "follow_ups":
      return ["follow_up_created"];
    default:
      return null;
  }
}

export function getModuleFilterEntityTypes(module: AuditModule): string[] | null {
  switch (module) {
    case "inbox":
      return ["inbox"];
    case "leads":
      return ["lead"];
    case "bookings":
      return ["booking"];
    case "payments":
      return ["payment"];
    case "settings":
      return ["settings", "team"];
    case "integrations":
      return ["integration"];
    default:
      return null;
  }
}
