import type { ConversationChannel } from "@/lib/domain/conversation";
import type { BookingSnapshot } from "@/lib/domain/booking";

export type CustomerSnapshotLeadBadge = {
  label: string;
  value: number;
};

export type CustomerSnapshotHeader = {
  id: string;
  name: string;
  avatarUrl: string | null;
  channel: ConversationChannel;
  channelLabel: string;
  statusLabel: string;
  joinedSince: string;
  leadBadge: CustomerSnapshotLeadBadge;
};

export type CustomerSnapshotJourneyStageState = "completed" | "current" | "pending";

export type CustomerSnapshotJourneyStage = {
  id: string;
  label: string;
  state: CustomerSnapshotJourneyStageState;
};

export type CustomerSnapshotAiInsight = {
  bullets: string[];
};

export type CustomerSnapshotActivityEvent = {
  id: string;
  title: string;
  timestamp: string;
};

export type CustomerSnapshotData = {
  header: CustomerSnapshotHeader;
  journey: CustomerSnapshotJourneyStage[];
  booking: BookingSnapshot;
  aiInsight: CustomerSnapshotAiInsight;
  recentActivity: CustomerSnapshotActivityEvent[];
};

export type CustomerSnapshotConversationSeed = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  channel: ConversationChannel;
  channelLabel: string;
  statusLabel: string | null;
  createdAt: string;
};

export type CustomerSnapshotLabels = {
  title: string;
  joinedSince: string;
  journey: string;
  bookingSummary: string;
  destination: string;
  travelers: string;
  departure: string;
  budget: string;
  noBookingYet: string;
  aiInsight: string;
  openCopilot: string;
  recentActivity: string;
  viewFullTimeline: string;
  journeyStageInquiry: string;
  journeyStageQualifying: string;
  journeyStageQualified: string;
  journeyStageBooking: string;
};

/** @deprecated Replaced by CustomerSnapshot — kept for legacy component files. */
export type Customer360LeadScore = CustomerSnapshotLeadBadge;

/** @deprecated Replaced by CustomerSnapshot */
export type Customer360QuickStats = {
  conversations: string;
  bookings: string;
  trips: string;
  lastContact: string;
  averageResponse: string;
  lifetimeValue: string;
};

/** @deprecated Replaced by CustomerSnapshotHeader */
export type Customer360ProfileHeader = CustomerSnapshotHeader & {
  assignedOwner: string;
  leadScore: CustomerSnapshotLeadBadge;
};

/** @deprecated Replaced by CustomerSnapshot */
export type Customer360Profile = {
  customer: Customer360ProfileHeader;
  stats: Record<string, string>;
  interestTags: string[];
  contact: Record<string, string>;
  preferences: Record<string, string>;
  relationship: Record<string, string>;
};

/** @deprecated */
export type Customer360ConversationSeed = CustomerSnapshotConversationSeed & {
  assignedOwner: string | null;
};
