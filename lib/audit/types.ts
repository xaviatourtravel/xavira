export const AUDIT_ACTIONS = [
  "reply_sent",
  "conversation_assigned",
  "conversation_status_changed",
  "conversation_converted_to_lead",
  "note_added",
  "lead_created",
  "lead_updated",
  "lead_status_changed",
  "follow_up_created",
  "booking_created",
  "booking_updated",
  "booking_status_changed",
  "booking_discount_updated",
  "payment_added",
  "payment_status_changed",
  "integration_connected",
  "integration_disconnected",
  "team_member_invited",
  "role_updated",
  "ai_settings_updated",
  "package_duplicated",
  "ai_customer_summary_generated",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ENTITY_TYPES = [
  "inbox",
  "lead",
  "booking",
  "payment",
  "settings",
  "integration",
  "team",
  "package",
] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export const AUDIT_MODULES = [
  "inbox",
  "leads",
  "follow_ups",
  "bookings",
  "payments",
  "settings",
  "integrations",
] as const;

export type AuditModule = (typeof AUDIT_MODULES)[number];

export type AuditActivitySummary = {
  repliesSent: number;
  leadsConverted: number;
  followUpsCreated: number;
  bookingsCreated: number;
  paymentsAdded: number;
};

export type AuditMetadata = Record<string, string | number | boolean | null>;

export type CreateAuditLogInput = {
  organizationId: string;
  actorUserId: string | null;
  actorName: string;
  actorRole: string;
  action: AuditAction | string;
  entityType: AuditEntityType | string;
  entityId?: string | null;
  entityLabel?: string | null;
  metadata?: AuditMetadata | null;
};

export type AuditLogRow = {
  id: string;
  organization_id: string;
  actor_user_id: string | null;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  metadata_json: AuditMetadata;
  created_at: string;
};

export type AuditLogFilters = {
  entityType?: string;
  module?: AuditModule | string;
  actorUserId?: string;
  actorRole?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
};
