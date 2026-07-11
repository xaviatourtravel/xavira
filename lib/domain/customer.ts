import type { ConversationChannel } from "./conversation";

export type CustomerLeadScore = {
  label: string;
  value: number;
};

export type CustomerIdentity = {
  id: string;
  name: string;
  avatarUrl: string | null;
  channel: ConversationChannel;
};

export type CustomerContact = {
  phone: string | null;
  email: string | null;
  city: string | null;
  language: string | null;
  timezone: string | null;
};

export type CustomerPreferences = {
  preferredDestination: string | null;
  preferredBudget: string | null;
  preferredDeparture: string | null;
  travelerCount: number | null;
  mealPreference: string | null;
  travelStyle: string | null;
};

export type CustomerRelationship = {
  assignedSalesId: string | null;
  assignedSalesName: string | null;
  lastFollowUpAt: string | null;
  lastQuotationAt: string | null;
  customerSince: string | null;
  referralSource: string | null;
};

export type CustomerStats = {
  conversationCount: number;
  bookingCount: number;
  tripCount: number;
  lastContactAt: string | null;
  averageResponseMinutes: number | null;
  lifetimeValueIdr: number | null;
};

/** Canonical customer aggregate shared across Inbox, CRM, and passport views. */
export type Customer = {
  identity: CustomerIdentity;
  contact: CustomerContact;
  preferences: CustomerPreferences;
  relationship: CustomerRelationship;
  stats: CustomerStats;
  interestTags: string[];
  leadScore: CustomerLeadScore | null;
};

/** Minimal customer seed derived from a conversation list/detail row. */
export type CustomerConversationSeed = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  channel: ConversationChannel;
  statusLabel: string | null;
  assignedOwnerName: string | null;
  createdAt: string;
};
