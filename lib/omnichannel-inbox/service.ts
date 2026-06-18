import {
  parseOmnichannelConversationStatus,
  parseOmnichannelMessageDirection,
} from "@/lib/omnichannel-inbox/constants";
import {
  findConversationById,
  findConversations,
  findMessagesByConversationId,
  insertConversationNote,
  insertMessage,
  resolveOrganizationProfileId,
  updateConversationById,
  type ConversationListFilters,
  type OmnichannelSupabaseClient,
} from "@/lib/omnichannel-inbox/repository";
import type { Json } from "@/types/database";
import type {
  ConversationNoteRow,
  ConversationRow,
  MessageRow,
  OmnichannelConversationStatus,
} from "@/types/omnichannel-inbox";

export type OmnichannelConversation = ConversationRow & {
  assignedUserName: string | null;
  tags: string[];
};

export type CreateOmnichannelMessageInput = {
  conversationId: string;
  direction: string;
  messageText?: string | null;
  externalMessageId?: string | null;
  attachmentsJson?: Json;
  sentByUserId?: string | null;
};

export type AddOmnichannelNoteInput = {
  conversationId: string;
  note: string;
  createdBy: string;
};

export class OmnichannelInboxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OmnichannelInboxError";
  }
}

function assertNonEmpty(value: string, field: string) {
  if (!value.trim()) {
    throw new OmnichannelInboxError(`${field} wajib diisi.`);
  }
}

async function requireConversation(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  conversationId: string,
) {
  const conversation = await findConversationById(
    supabase,
    organizationId,
    conversationId,
  );

  if (!conversation) {
    throw new OmnichannelInboxError("Conversation tidak ditemukan.");
  }

  return conversation;
}

export async function getConversations(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  filters: ConversationListFilters = {},
): Promise<OmnichannelConversation[]> {
  assertNonEmpty(organizationId, "organizationId");
  return findConversations(supabase, organizationId, filters);
}

export async function getConversation(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  conversationId: string,
): Promise<OmnichannelConversation | null> {
  assertNonEmpty(organizationId, "organizationId");
  assertNonEmpty(conversationId, "conversationId");
  return findConversationById(supabase, organizationId, conversationId);
}

export async function getMessages(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  conversationId: string,
): Promise<MessageRow[] | null> {
  assertNonEmpty(organizationId, "organizationId");
  assertNonEmpty(conversationId, "conversationId");
  return findMessagesByConversationId(
    supabase,
    organizationId,
    conversationId,
  );
}

export async function createMessage(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  input: CreateOmnichannelMessageInput,
): Promise<MessageRow> {
  assertNonEmpty(organizationId, "organizationId");
  assertNonEmpty(input.conversationId, "conversationId");

  const direction = parseOmnichannelMessageDirection(input.direction);
  if (!direction) {
    throw new OmnichannelInboxError("Direction pesan tidak valid.");
  }

  await requireConversation(supabase, organizationId, input.conversationId);

  if (direction === "outgoing") {
    if (!input.sentByUserId) {
      throw new OmnichannelInboxError(
        "sentByUserId wajib diisi untuk pesan outgoing.",
      );
    }

    const profileId = await resolveOrganizationProfileId(
      supabase,
      organizationId,
      input.sentByUserId,
    );

    if (!profileId) {
      throw new OmnichannelInboxError(
        "Pengirim pesan tidak ditemukan di organisasi ini.",
      );
    }
  }

  const hasText = Boolean(input.messageText?.trim());
  const attachments = Array.isArray(input.attachmentsJson)
    ? input.attachmentsJson
    : [];

  if (!hasText && attachments.length === 0) {
    throw new OmnichannelInboxError(
      "Pesan harus memiliki messageText atau attachments.",
    );
  }

  return insertMessage(supabase, {
    conversation_id: input.conversationId,
    direction,
    external_message_id: input.externalMessageId ?? null,
    message_text: input.messageText?.trim() || null,
    attachments_json: attachments as Json,
    sent_by_user_id: input.sentByUserId ?? null,
  });
}

export async function assignConversation(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  conversationId: string,
  assignedUserId: string | null,
): Promise<OmnichannelConversation> {
  assertNonEmpty(organizationId, "organizationId");
  assertNonEmpty(conversationId, "conversationId");

  await requireConversation(supabase, organizationId, conversationId);

  if (assignedUserId) {
    const profileId = await resolveOrganizationProfileId(
      supabase,
      organizationId,
      assignedUserId,
    );

    if (!profileId) {
      throw new OmnichannelInboxError(
        "Assignee tidak ditemukan di organisasi ini.",
      );
    }
  }

  const updated = await updateConversationById(
    supabase,
    organizationId,
    conversationId,
    { assigned_user_id: assignedUserId },
  );

  if (!updated) {
    throw new OmnichannelInboxError("Gagal mengassign conversation.");
  }

  const conversation = await findConversationById(
    supabase,
    organizationId,
    conversationId,
  );

  if (!conversation) {
    throw new OmnichannelInboxError("Conversation tidak ditemukan setelah update.");
  }

  return conversation;
}

export async function updateConversationStatus(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  conversationId: string,
  status: string,
): Promise<OmnichannelConversation> {
  assertNonEmpty(organizationId, "organizationId");
  assertNonEmpty(conversationId, "conversationId");

  const parsedStatus = parseOmnichannelConversationStatus(status);
  if (!parsedStatus) {
    throw new OmnichannelInboxError("Status conversation tidak valid.");
  }

  await requireConversation(supabase, organizationId, conversationId);

  const updated = await updateConversationById(
    supabase,
    organizationId,
    conversationId,
    { status: parsedStatus },
  );

  if (!updated) {
    throw new OmnichannelInboxError("Gagal memperbarui status conversation.");
  }

  const conversation = await findConversationById(
    supabase,
    organizationId,
    conversationId,
  );

  if (!conversation) {
    throw new OmnichannelInboxError("Conversation tidak ditemukan setelah update.");
  }

  return conversation;
}

export async function addNote(
  supabase: OmnichannelSupabaseClient,
  organizationId: string,
  input: AddOmnichannelNoteInput,
): Promise<ConversationNoteRow> {
  assertNonEmpty(organizationId, "organizationId");
  assertNonEmpty(input.conversationId, "conversationId");
  assertNonEmpty(input.note, "note");
  assertNonEmpty(input.createdBy, "createdBy");

  await requireConversation(supabase, organizationId, input.conversationId);

  const profileId = await resolveOrganizationProfileId(
    supabase,
    organizationId,
    input.createdBy,
  );

  if (!profileId) {
    throw new OmnichannelInboxError(
      "Penulis catatan tidak ditemukan di organisasi ini.",
    );
  }

  return insertConversationNote(supabase, {
    conversation_id: input.conversationId,
    note: input.note.trim(),
    created_by: profileId,
  });
}

export type {
  ConversationListFilters,
  OmnichannelConversationStatus,
};
