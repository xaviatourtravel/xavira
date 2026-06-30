"use client";

import { useMemo } from "react";

import {
  IntelligenceDivider,
  IntelligenceSection,
  IntelligenceSurface,
} from "@/components/communication-workspace/primitives";
import {
  formatInboxMessageTime,
  formatInboxRelativeTime,
  getConversationDisplayName,
} from "@/components/omnichannel-inbox/inbox-display";
import {
  buildRuleBasedIntelligence,
  type IntelligencePriority,
  type IntelligenceSentiment,
} from "@/lib/communication/intelligence/rule-based-intelligence";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { cn } from "@/lib/utils";

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2">
      <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 text-right text-xs",
          value ? "text-foreground" : "text-muted-foreground/60",
        )}
      >
        {value && value.trim() ? value : "Belum ada"}
      </span>
    </div>
  );
}

const SENTIMENT_CHIP: Record<IntelligenceSentiment, string> = {
  positive:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  neutral: "bg-muted text-muted-foreground",
  concerned:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
};

const PRIORITY_CHIP: Record<IntelligencePriority, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  medium: "bg-muted text-muted-foreground",
};

function Chip({ className, children }: { className?: string; children: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
        className ?? "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function ConversationIntelligenceTab({
  conversation,
}: {
  conversation: OmnichannelConversationDetail;
}) {
  const displayName = getConversationDisplayName(conversation);

  const intel = useMemo(
    () =>
      buildRuleBasedIntelligence(
        {
          displayName,
          channelLabel: conversation.channelLabel,
          statusLabel: conversation.statusLabel,
          unreadCount: conversation.unreadCount,
          leadId: conversation.leadId,
        },
        conversation.messages,
      ),
    [
      conversation.messages,
      conversation.channelLabel,
      conversation.statusLabel,
      conversation.unreadCount,
      conversation.leadId,
      displayName,
    ],
  );

  const phone =
    conversation.channel === "whatsapp"
      ? conversation.customerUsername ?? conversation.externalUserId
      : conversation.customerUsername;

  const totalMessages = conversation.messages.length;
  const firstInteraction =
    conversation.messages[0]?.created_at ?? conversation.createdAt;
  const lastInteraction =
    conversation.lastMessageAt ??
    conversation.messages[conversation.messages.length - 1]?.created_at ??
    null;

  const leadStatus = conversation.leadId
    ? "Sudah jadi lead"
    : "Belum dikonversi";

  return (
    <div className="space-y-6">
      <IntelligenceSection title="Intelijen percakapan">
        {intel.hasData ? (
          <IntelligenceSurface className="space-y-3 p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Chip>{intel.intentLabel}</Chip>
              <Chip className={SENTIMENT_CHIP[intel.sentiment]}>
                {intel.sentimentLabel}
              </Chip>
              <Chip className={PRIORITY_CHIP[intel.priority]}>
                {`Prioritas ${intel.priorityLabel}`}
              </Chip>
            </div>

            {intel.summary ? (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Ringkasan
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-foreground">
                  {intel.summary}
                </p>
              </div>
            ) : null}

            <div className="-mx-3 divide-y divide-border border-y border-soft">
              <InfoRow label="Destinasi" value={intel.entities.destination} />
              <InfoRow label="Pax" value={intel.entities.pax} />
              <InfoRow label="Tanggal" value={intel.entities.departure} />
              <InfoRow label="Budget" value={intel.entities.budget} />
              <InfoRow label="Concern" value={intel.entities.concern} />
              <InfoRow
                label="Pertanyaan terakhir"
                value={intel.entities.latestQuestion}
              />
            </div>

            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Saran tindakan
              </p>
              <p className="text-xs font-medium text-foreground">
                {intel.nextActionLabel}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Saran balasan
              </p>
              <p className="mt-1 rounded-lg bg-muted/40 px-3 py-2 text-xs leading-relaxed text-foreground">
                {intel.suggestedReply}
              </p>
            </div>
          </IntelligenceSurface>
        ) : (
          <IntelligenceSurface className="p-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Belum cukup data percakapan.
            </p>
          </IntelligenceSurface>
        )}
        <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
          Dihitung otomatis dari isi percakapan (berbasis aturan, tanpa AI
          eksternal).
        </p>
      </IntelligenceSection>

      <IntelligenceDivider />

      <IntelligenceSection title="Detail kontak">
        <IntelligenceSurface className="divide-y divide-border">
          <InfoRow label="Kanal" value={conversation.channelLabel} />
          <InfoRow label="Nama" value={displayName} />
          <InfoRow label="Telepon" value={phone ?? null} />
          <InfoRow label="Status" value={conversation.statusLabel} />
          <InfoRow
            label="Ditugaskan ke"
            value={conversation.assignedUserName ?? "Belum ditugaskan"}
          />
          <InfoRow
            label="Label"
            value={
              conversation.labels.length > 0
                ? conversation.labels.map((label) => label.tag).join(", ")
                : "Belum ada label"
            }
          />
          <InfoRow label="Status lead" value={leadStatus} />
        </IntelligenceSurface>
      </IntelligenceSection>

      <IntelligenceSection title="Aktivitas">
        <IntelligenceSurface className="divide-y divide-border">
          <InfoRow label="Total pesan" value={`${totalMessages} pesan`} />
          <InfoRow
            label="Pesan terakhir"
            value={conversation.lastMessagePreview ?? null}
          />
          <InfoRow
            label="Waktu terakhir"
            value={
              lastInteraction ? formatInboxRelativeTime(lastInteraction) : null
            }
          />
          <InfoRow
            label="Interaksi pertama"
            value={
              firstInteraction ? formatInboxMessageTime(firstInteraction) : null
            }
          />
          <InfoRow
            label="Interaksi terakhir"
            value={
              lastInteraction ? formatInboxMessageTime(lastInteraction) : null
            }
          />
        </IntelligenceSurface>
      </IntelligenceSection>
    </div>
  );
}
