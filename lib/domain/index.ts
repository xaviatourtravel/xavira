export type {
  Conversation,
  ConversationChannel,
  ConversationLabel,
  ConversationMessage,
  ConversationMessageDeliveryStatus,
  ConversationMessageDirection,
  ConversationStatus,
} from "./conversation";

export type {
  Customer,
  CustomerContact,
  CustomerConversationSeed,
  CustomerIdentity,
  CustomerLeadScore,
  CustomerPreferences,
  CustomerRelationship,
  CustomerStats,
} from "./customer";

export type { Lead, LeadRow } from "./lead";

export type {
  Booking,
  BookingRow,
  BookingSnapshot,
  BookingStatus,
} from "./booking";

export type { Package, PackageRow } from "./package";

export type {
  AssignmentEvent,
  Owner,
  OwnerStatus,
  OwnershipHistoryEntry,
  SubjectAssignment,
} from "./owner";

export type {
  CustomerJourney,
  JourneyStage,
  JourneyStageProgress,
} from "./journey-stage";

export type {
  Activity,
  ActivityActor,
  ActivityRow,
  ActivityType,
} from "./activity";

export type {
  CreateInternalNoteInput,
  InternalNote,
  InternalNoteAuthor,
  InternalNoteRow,
} from "./internal-note";

export type {
  AISummary,
  AISummaryHandoff,
  AISummaryIntentLevel,
  AISummaryMissingField,
  AISummaryTemperature,
} from "./ai-summary";

export {
  mapConversationFromRow,
  mapConversationMessageFromRow,
  mapConversationMessagesFromRows,
} from "./mappers/conversation";

export {
  mapLeadFromRow,
  mapLeadFromSalesAssistantRow,
} from "./mappers/lead";

export {
  BOOKING_SNAPSHOT_EMPTY_VALUE,
  isBookingSnapshotEmpty,
  mapBookingFromRow,
  mapBookingSnapshotFromConversation,
} from "./mappers/booking";

export { mapPackageFromRow } from "./mappers/package";

export {
  mapAssignmentEventFromHistoryEntry,
  mapAssignmentEventsFromHistoryEntries,
  mapOwnershipHistoryFromAssignmentEvent,
  mapOwnershipHistoryFromAssignmentEvents,
} from "./mappers/assignment";

export {
  mapActivityFromRow,
  mapActivityToCustomerTimelineEvent,
  mapCustomerTimelineEventToActivity,
  mapInternalNoteFromRow,
  mapInternalNoteToLegacyShape,
  mapLegacyInternalNoteToDomain,
} from "./mappers/activity";

export {
  mapAiSummaryFromCustomerAiSummary,
  mapAiSummaryHandoffFromSalesTakeover,
  mapAiSummaryLinesFromHandoff,
  mapCustomerAiSummaryFromDomain,
  mapCustomerConversationSeedFromConversation,
} from "./mappers/ai-summary";
