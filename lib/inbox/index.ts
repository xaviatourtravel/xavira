/**
 * Inbox Lite V1 module layout.
 *
 * Data layer:
 * - `constants.ts` — sources, statuses, metadata shape (future WhatsApp / AI fields)
 * - `queries.ts` — conversation list/detail loaders
 * - `metrics.ts` — dashboard KPIs
 * - `source-mapping.ts` — inbox source → lead_source mapping
 *
 * UI / routes:
 * - `app/(dashboard)/inbox/page.tsx` — conversation list + manual capture
 * - `app/(dashboard)/inbox/[id]/page.tsx` — qualify, assign, convert to lead
 * - `app/(dashboard)/inbox/actions.ts` — server mutations
 *
 * Future integration points (metadata + actions, no schema change required):
 * - WhatsApp Cloud API → populate `external_thread_id`, `whatsapp_number`, `last_message`
 * - AI Assistant → `ai_summary` on conversation metadata
 * - AI Auto Qualification → `ai_qualification`, auto status transitions
 */

export {
  INBOX_SOURCES,
  INBOX_STATUSES,
  formatInboxSourceLabel,
  formatInboxStatusLabel,
  getDefaultInboxMetadata,
  isInboxSource,
  isInboxStatus,
  parseInboxSource,
  parseInboxStatus,
  type InboxConversationMetadata,
  type InboxSource,
  type InboxStatus,
} from "@/lib/inbox/constants";

export {
  loadInboxConversations,
  loadInboxConversationById,
  mapInboxConversationRow,
  type InboxConversationListItem,
  type InboxListFilters,
} from "@/lib/inbox/queries";

export {
  loadInboxDashboardMetrics,
  type InboxDashboardMetrics,
} from "@/lib/inbox/metrics";

export { mapInboxSourceToLeadSource } from "@/lib/inbox/source-mapping";
