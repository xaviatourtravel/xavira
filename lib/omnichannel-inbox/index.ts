/**
 * Omnichannel Inbox Foundation (Phase 1)
 *
 * Data layer for Instagram DM, Facebook Messenger, and future WhatsApp.
 * UI and webhook ingestion are out of scope for this phase.
 *
 * Tables (Supabase):
 * - `conversations` — thread metadata, assignment, pipeline status
 * - `messages` — inbound/outbound message log
 * - `conversation_notes` — internal team notes
 * - `conversation_tags` — lightweight labeling (repository helpers TBD)
 *
 * Layers:
 * - `constants.ts` — channel/status/direction enums + parsers
 * - `repository.ts` — Supabase queries (org-scoped)
 * - `service.ts` — validated business operations
 *
 * Future integration points:
 * - Meta webhooks → `app/api/webhooks/meta` + `meta-ingestion.ts`
 * - WhatsApp Cloud API → same pattern with `channel = whatsapp`
 * - Inbox UI → consume `getConversations` / `getMessages` from server routes
 *
 * Note: coexists with legacy `inbox_conversations` (Inbox Lite V1).
 * New omnichannel work should use this module.
 */

export {
  OMNICHANNEL_CHANNELS,
  OMNICHANNEL_CONVERSATION_STATUSES,
  OMNICHANNEL_MESSAGE_DIRECTIONS,
  formatOmnichannelChannelLabel,
  formatOmnichannelConversationStatusLabel,
  isOmnichannelChannel,
  isOmnichannelConversationStatus,
  isOmnichannelMessageDirection,
  parseOmnichannelChannel,
  parseOmnichannelConversationStatus,
  parseOmnichannelMessageDirection,
} from "@/lib/omnichannel-inbox/constants";

export {
  findConversationByExternalId,
  findConversations,
  findConversationById,
  findMessageByExternalId,
  findMessagesByConversationId,
  findNotesByConversationId,
  insertConversation,
  mapConversationRow,
  markConversationAsRead,
  upsertConversationFromWebhook,
  type ConversationListFilters,
  type ConversationWithRelations,
  type OmnichannelSupabaseClient,
} from "@/lib/omnichannel-inbox/repository";

export {
  ingestMetaIncomingMessages,
} from "@/lib/omnichannel-inbox/meta-ingestion";

export {
  metaWebhookDevLog,
  parseMetaIncomingMessages,
  parseMetaWebhookPayload,
  verifyMetaWebhookSignature,
  verifyMetaWebhookSubscription,
  type MetaWebhookIngestResult,
  type ParsedMetaIncomingMessage,
} from "@/lib/omnichannel-inbox/meta-webhook";

export {
  OmnichannelInboxError,
  addNote,
  assignConversation,
  createMessage,
  getConversation,
  getConversations,
  getMessages,
  updateConversationStatus,
  type AddOmnichannelNoteInput,
  type CreateOmnichannelMessageInput,
  type OmnichannelConversation,
} from "@/lib/omnichannel-inbox/service";

export {
  canAddOmnichannelConversationNote,
  canReassignOmnichannelConversation,
  canReplyToOmnichannelConversation,
  canUpdateOmnichannelConversationStatus,
  canViewAllOmnichannelConversations,
} from "@/lib/omnichannel-inbox/permissions";

export {
  getOmnichannelSendReplyErrorMessage,
  sendConversationReply,
  OmnichannelSendReplyError,
} from "@/lib/omnichannel-inbox/send-reply";

export {
  MetaMessagingError,
  resolveMetaMessagingCredentials,
  sendMetaChannelMessage,
} from "@/lib/omnichannel-inbox/meta-messaging";

export {
  loadOmnichannelConversationDetail,
  loadOmnichannelConversationList,
  parseOmnichannelInboxFilter,
  type OmnichannelConversationDetail,
  type OmnichannelConversationListItem,
  type OmnichannelInboxFilter,
} from "@/lib/omnichannel-inbox/queries";

export type {
  ConversationInsert,
  ConversationNoteRow,
  ConversationRow,
  ConversationTagRow,
  MessageRow,
  OmnichannelChannel,
  OmnichannelConversationStatus,
  OmnichannelMessageDirection,
} from "@/types/omnichannel-inbox";
