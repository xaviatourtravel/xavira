"use client";

import {
  FileCheck,
  FileText,
  Plane,
  Shield,
  Stamp,
  Ticket,
} from "lucide-react";

import {
  AURORA_BOOKING_CARD,
  AURORA_BOOKING_CARD_BODY,
  AURORA_BOOKING_CARD_HEADER,
  AURORA_BOOKING_CARD_TITLE,
  AURORA_BOOKING_DOCUMENT_ICON,
  AURORA_BOOKING_DOCUMENT_ROW,
  AURORA_BOOKING_GHOST_BUTTON,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

import type { BookingDocument, BookingWorkspaceLabels, DocumentStatus } from "./types";

type DocumentsCardProps = {
  documents: BookingDocument[];
  labels: BookingWorkspaceLabels;
  className?: string;
};

const DOCUMENT_ICONS = {
  passport: Stamp,
  visa: FileCheck,
  voucher: Ticket,
  insurance: Shield,
  ticket: Plane,
  invoice: FileText,
} as const;

const DOCUMENT_STATUS_LABEL: Record<
  DocumentStatus,
  keyof Pick<
    BookingWorkspaceLabels,
    | "documentStatusMissing"
    | "documentStatusPending"
    | "documentStatusReceived"
    | "documentStatusVerified"
  >
> = {
  missing: "documentStatusMissing",
  pending: "documentStatusPending",
  received: "documentStatusReceived",
  verified: "documentStatusVerified",
};

const DOCUMENT_STATUS_CLASS: Record<DocumentStatus, string> = {
  missing: "text-muted-foreground/60",
  pending: "text-amber-700",
  received: "text-sky-700",
  verified: "text-emerald-700",
};

export function DocumentsCard({ documents, labels, className }: DocumentsCardProps) {
  return (
    <section className={cn(AURORA_BOOKING_CARD, className)}>
      <header className={AURORA_BOOKING_CARD_HEADER}>
        <h2 className={AURORA_BOOKING_CARD_TITLE}>{labels.documents}</h2>
      </header>
      <div className={cn(AURORA_BOOKING_CARD_BODY, "space-y-2")}>
        {documents.map((document) => {
          const Icon = DOCUMENT_ICONS[document.type];
          const statusKey = DOCUMENT_STATUS_LABEL[document.status];

          return (
            <div key={document.id} className={AURORA_BOOKING_DOCUMENT_ROW}>
              <span className={AURORA_BOOKING_DOCUMENT_ICON}>
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{document.label}</p>
                <p
                  className={cn(
                    "text-xs font-medium",
                    DOCUMENT_STATUS_CLASS[document.status],
                  )}
                >
                  {labels[statusKey]}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" className={AURORA_BOOKING_GHOST_BUTTON}>
                  {labels.open}
                </button>
                <button type="button" className={AURORA_BOOKING_GHOST_BUTTON}>
                  {labels.replace}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
