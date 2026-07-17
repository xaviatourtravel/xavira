"use client";

import type { InvoiceTemplateKey } from "@/modules/finance/pdf/invoice-pdf-types";

/**
 * Mini-layout previews for template picker — match redesigned structures.
 */
export function InvoiceTemplateThumbnail({
  templateKey,
  primaryColor,
  accentColor,
}: {
  templateKey: InvoiceTemplateKey | string;
  primaryColor: string;
  accentColor: string;
}) {
  const primary = /^#[0-9A-Fa-f]{6}$/.test(primaryColor) ? primaryColor : "#0F172A";
  const accent = /^#[0-9A-Fa-f]{6}$/.test(accentColor) ? accentColor : "#64748B";
  const tint = mixWhite(primary, 0.92);

  return (
    <div
      className="relative mb-3 h-20 overflow-hidden rounded-md border bg-white"
      data-template-preview={templateKey}
      aria-hidden
    >
      {templateKey === "calm-standard" ? (
        <CalmPreview primary={primary} accent={accent} />
      ) : templateKey === "corporate" ? (
        <CorporatePreview primary={primary} accent={accent} />
      ) : templateKey === "travel-banner" ? (
        <TravelPreview primary={primary} tint={tint} />
      ) : (
        <EditorialPreview primary={primary} tint={tint} />
      )}
    </div>
  );
}

function mixWhite(hex: string, amount: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c * (1 - amount) + 255 * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function TableStub() {
  return (
    <div className="mt-1 space-y-0.5 px-1" data-preview-region="table">
      <div className="h-px bg-slate-800" />
      <div className="h-1 rounded bg-slate-200" />
      <div className="h-1 w-4/5 rounded bg-slate-100" />
    </div>
  );
}

function CalmPreview({ primary }: { primary: string; accent: string }) {
  return (
    <div className="relative h-full p-1.5" data-preview-layout="calm-header">
      <div className="flex items-center gap-1" data-preview-region="header">
        <div
          className="h-2.5 w-2.5 rounded border border-slate-200"
          style={{ backgroundColor: primary, opacity: 0.12 }}
        />
        <div className="h-0.5 w-8 rounded bg-slate-300" />
      </div>
      <div className="mt-2 h-2 w-12 rounded bg-slate-800/80" data-preview-region="title" />
      <div className="mt-1.5 h-px bg-slate-200" />
      <div className="mt-1.5 flex gap-2">
        <div className="h-3 flex-1" data-preview-region="recipient">
          <div className="h-0.5 w-7 rounded bg-slate-200" />
          <div className="mt-0.5 h-0.5 w-10 rounded bg-slate-100" />
        </div>
        <div className="h-3 w-9" data-preview-region="meta">
          <div className="h-0.5 w-full rounded bg-slate-100" />
          <div className="mt-0.5 h-0.5 w-2/3 rounded bg-slate-100" />
        </div>
      </div>
      <TableStub />
      <div className="absolute bottom-1 right-1 w-7 space-y-0.5" data-preview-region="totals">
        <div className="h-0.5 rounded bg-slate-200" />
        <div className="h-1 rounded" style={{ backgroundColor: primary, opacity: 0.3 }} />
      </div>
    </div>
  );
}

function CorporatePreview({ primary }: { primary: string; accent: string }) {
  return (
    <div className="relative h-full p-1" data-preview-layout="corporate-header">
      {/* Restrained header line */}
      <div
        className="mb-1 h-0.5 w-full"
        style={{ backgroundColor: primary }}
        data-preview-region="header"
      />
      <div className="flex items-start justify-between gap-1 px-0.5">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border border-slate-200 bg-slate-50" />
          <div className="h-1 w-8 rounded bg-slate-300" />
        </div>
        <div className="h-2 w-7 rounded bg-slate-800/70" data-preview-region="meta" />
      </div>
      <div className="mt-1.5 flex gap-1 px-0.5">
        <div className="h-2.5 flex-1 rounded bg-slate-50" data-preview-region="recipient" />
      </div>
      <TableStub />
      <div
        className="absolute bottom-1 left-1 right-1 flex gap-1"
        data-preview-region="payment-totals"
      >
        <div className="h-3 flex-1 rounded border border-slate-100 bg-slate-50" />
        <div className="h-3 w-8 space-y-0.5 rounded border border-slate-100 bg-slate-50 p-0.5">
          <div className="h-0.5 rounded bg-slate-200" />
          <div className="h-1 rounded" style={{ backgroundColor: primary, opacity: 0.3 }} />
        </div>
      </div>
    </div>
  );
}

function TravelPreview({ primary, tint }: { primary: string; tint: string }) {
  return (
    <div className="relative h-full" data-preview-layout="travel-banner">
      <div
        className="flex h-8 flex-col justify-center gap-1 border-b px-1.5"
        style={{ backgroundColor: tint, borderBottomColor: primary }}
        data-preview-region="banner"
      >
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded border border-slate-300 bg-white" />
            <div className="h-1 w-9 rounded bg-slate-600/70" />
          </div>
          <div className="h-1 w-5 rounded bg-slate-500/50" />
        </div>
        <div className="flex items-center gap-0.5" data-preview-region="route-motif">
          <div
            className="h-1 w-1 rounded-full border"
            style={{ borderColor: primary }}
          />
          <div className="h-px flex-1" style={{ backgroundColor: primary, opacity: 0.3 }} />
          <div className="h-0.5 w-0.5 rounded-full" style={{ backgroundColor: primary }} />
          <div className="h-px flex-1" style={{ backgroundColor: primary, opacity: 0.3 }} />
          <div
            className="h-0 w-0 border-y-[3px] border-l-[5px] border-y-transparent"
            style={{ borderLeftColor: primary }}
          />
          <div className="h-px flex-1" style={{ backgroundColor: primary, opacity: 0.3 }} />
          <div className="h-1 w-1 rounded-full" style={{ backgroundColor: primary }} />
        </div>
      </div>
      <div className="p-1.5">
        <div className="flex gap-2">
          <div className="h-3 flex-1 rounded bg-slate-50" />
          <div className="h-3 w-7 rounded bg-slate-50" />
        </div>
        <TableStub />
      </div>
    </div>
  );
}

function EditorialPreview({
  primary,
  tint,
}: {
  primary: string;
  tint: string;
}) {
  return (
    <div className="relative flex h-full" data-preview-layout="editorial-sidebar">
      <div
        className="w-5 shrink-0 space-y-1 border-r border-slate-200 p-1"
        style={{ backgroundColor: tint }}
        data-preview-region="sidebar"
      >
        <div className="h-2.5 w-2.5 rounded border border-slate-300 bg-white" />
        <div className="h-1 w-full rounded bg-slate-500/40" />
        <div className="h-1 w-3/4 rounded bg-slate-400/30" />
        <div className="h-1 w-2/3 rounded bg-slate-400/25" />
        <div className="mt-1 h-px" style={{ backgroundColor: primary, opacity: 0.3 }} />
        <div className="h-1 w-full rounded bg-slate-500/30" />
      </div>
      <div className="relative min-w-0 flex-1 p-1.5">
        <div className="h-1.5 w-8 rounded bg-slate-800/80" data-preview-region="header" />
        <TableStub />
        <div className="absolute bottom-1 right-1 w-7 space-y-0.5" data-preview-region="totals">
          <div className="h-0.5 rounded bg-slate-200" />
          <div className="h-1 rounded" style={{ backgroundColor: primary, opacity: 0.3 }} />
        </div>
      </div>
    </div>
  );
}
