import type { AuditAction, AuditEntityType } from "./types";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  reply_sent: "Reply sent",
  conversation_assigned: "Conversation assigned",
  conversation_status_changed: "Conversation status changed",
  conversation_converted_to_lead: "Converted Lead",
  note_added: "Note added",
  lead_created: "Lead created",
  lead_updated: "Lead updated",
  lead_status_changed: "Lead status changed",
  follow_up_created: "Follow-up created",
  booking_created: "Booking created",
  booking_updated: "Booking updated",
  booking_status_changed: "Booking status changed",
  booking_discount_updated: "Booking discount updated",
  payment_added: "Payment added",
  payment_status_changed: "Payment status changed",
  integration_connected: "Integration connected",
  integration_disconnected: "Integration disconnected",
  team_member_invited: "Team member invited",
  role_updated: "Role updated",
  ai_settings_updated: "AI settings updated",
  package_duplicated: "Package duplicated",
  ai_customer_summary_generated: "AI customer summary generated",
};

export const AUDIT_ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
  inbox: "Inbox",
  lead: "Leads",
  booking: "Bookings",
  payment: "Payments",
  settings: "Settings",
  integration: "Integrations",
  team: "Team",
  package: "Packages",
};

export function formatAuditActionLabel(action: string) {
  return (
    AUDIT_ACTION_LABELS[action as AuditAction] ??
    action.replace(/_/g, " ")
  );
}

export function formatAuditEntityTypeLabel(entityType: string) {
  return (
    AUDIT_ENTITY_TYPE_LABELS[entityType as AuditEntityType] ??
    entityType.replace(/_/g, " ")
  );
}

export function summarizeAuditMetadata(metadata: Record<string, unknown> | null) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "—";
  }

  const parts: string[] = [];

  for (const [key, value] of Object.entries(metadata)) {
    if (value == null || value === "") {
      continue;
    }

    const label = key.replace(/_/g, " ");
    parts.push(`${label}: ${String(value)}`);
  }

  return parts.slice(0, 4).join(" · ") || "—";
}
