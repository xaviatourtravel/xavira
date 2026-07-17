import type { Profile } from "@/types/app-types";

import {
  assertInvoicePermission,
  assertSameOrganization,
  requireOrganizationId,
} from "@/modules/finance/lib/invoice-access";
import {
  codeForStageError,
  InvoicePdfStageError,
  logInvoicePdfStage,
} from "@/modules/finance/pdf/invoice-pdf-debug";
import { buildInvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-data";
import { safePdfErrorCode } from "@/modules/finance/pdf/invoice-pdf-http";
import { materializeImmutableInvoiceLogo } from "@/modules/finance/pdf/invoice-pdf-logo";
import {
  renderInvoicePdfBuffer,
  sanitizeInvoicePdfFileName,
} from "@/modules/finance/pdf/invoice-pdf-renderer";
import {
  downloadInvoicePdfFromStorage,
  uploadInvoicePdfToStorage,
} from "@/modules/finance/pdf/invoice-pdf-storage";
import * as repo from "@/modules/finance/repositories/invoice-repository";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";
import type { InvoiceRecord } from "@/modules/finance/types/invoices";

export type InvoicePdfResult = {
  buffer: Buffer;
  fileName: string;
  invoice: InvoiceRecord;
  fromCache: boolean;
};

export class InvoicePdfNotReadyError extends Error {
  readonly pdfStatus: string;
  readonly errorCode: string | null;

  constructor(invoice: InvoiceRecord) {
    super("Invoice PDF is not ready");
    this.name = "InvoicePdfNotReadyError";
    this.pdfStatus = invoice.pdfStatus ?? "not_generated";
    this.errorCode = invoice.pdfErrorCode ?? null;
  }
}

export class InvoicePdfInProgressError extends Error {
  constructor() {
    super("PDF generation already in progress");
    this.name = "InvoicePdfInProgressError";
  }
}

/** Client-safe generation failure — HTTP 500, no internal details. */
export class InvoicePdfGenerationFailedError extends Error {
  readonly errorCode: string;

  constructor(errorCode: string) {
    super("PDF generation failed. You can retry.");
    this.name = "InvoicePdfGenerationFailedError";
    this.errorCode = errorCode;
  }
}

function readSnapshotLogoUrl(invoice: InvoiceRecord): string | null {
  const snap =
    invoice.companySnapshot && typeof invoice.companySnapshot === "object"
      ? (invoice.companySnapshot as Record<string, unknown>)
      : {};
  const raw = snap.logoUrl ?? snap.logo_url;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function readSnapshotLegalName(invoice: InvoiceRecord): string {
  const snap =
    invoice.companySnapshot && typeof invoice.companySnapshot === "object"
      ? (invoice.companySnapshot as Record<string, unknown>)
      : {};
  const name = snap.legalName ?? snap.legal_name;
  return typeof name === "string" && name.trim() ? name.trim() : "Company";
}

/**
 * Claim / freeze RPCs return header rows without invoice_items.
 * Always rehydrate from an authoritative org-scoped fetch before rendering.
 */
export async function hydrateInvoiceWithItemsForPdf(
  organizationId: string,
  invoiceId: string,
  overlay?: Partial<InvoiceRecord>,
): Promise<InvoiceRecord> {
  const hydrated = await repo.getInvoiceById(organizationId, invoiceId);
  if (!hydrated) {
    throw new InvoicePdfStageError(
      "data_normalization",
      "Invoice not found while hydrating PDF data",
    );
  }
  const merged: InvoiceRecord = {
    ...hydrated,
    ...overlay,
    items: hydrated.items,
  };
  if (!merged.items?.length) {
    throw new InvoicePdfStageError(
      "data_normalization",
      "Invoice has no line items",
    );
  }
  return merged;
}

export async function getAuthorizedInvoiceForPdf(
  profile: Profile,
  invoiceId: string,
): Promise<InvoiceRecord> {
  assertInvoicePermission(profile, "invoices.view");
  const organizationId = requireOrganizationId(profile);
  const invoice = await repo.getInvoiceById(organizationId, invoiceId);
  if (!invoice) {
    throw new Error("Invoice not found");
  }
  assertSameOrganization(invoice.organizationId, organizationId);
  return invoice;
}

/** Draft: ephemeral render only — never writes Storage or PDF status. */
export async function renderDraftInvoicePdfPreview(
  profile: Profile,
  invoiceId: string,
): Promise<InvoicePdfResult> {
  const invoice = await getAuthorizedInvoiceForPdf(profile, invoiceId);
  if (invoice.lifecycleStatus !== "draft") {
    throw new Error("Preview mode is only for draft invoices");
  }

  const data = await buildInvoicePdfData(invoice, { mode: "draft" });
  const buffer = await renderInvoicePdfBuffer(data);
  return {
    buffer,
    fileName: sanitizeInvoicePdfFileName(null, "draft"),
    invoice,
    fromCache: false,
  };
}

/**
 * GET-safe issued PDF read: stream stored ready PDF only.
 * Does not claim, generate, upload, or record events.
 */
export async function getIssuedInvoicePdfIfReady(
  profile: Profile,
  invoiceId: string,
): Promise<InvoicePdfResult> {
  const invoice = await getAuthorizedInvoiceForPdf(profile, invoiceId);
  if (invoice.lifecycleStatus === "draft" || invoice.lifecycleStatus === "void") {
    throw new Error("Issued PDF is only available for issued invoices");
  }

  const fileName = sanitizeInvoicePdfFileName(invoice.invoiceNumber, "issued");

  if (invoice.pdfStatus === "ready" && invoice.pdfStoragePath) {
    const cached = await downloadInvoicePdfFromStorage(
      invoice.pdfStoragePath,
      invoice.organizationId,
    );
    if (cached) {
      return { buffer: cached, fileName, invoice, fromCache: true };
    }
  }

  throw new InvoicePdfNotReadyError(invoice);
}

async function ensureFrozenLogoAsset(
  invoice: InvoiceRecord,
): Promise<InvoiceRecord> {
  if (invoice.logoAssetPath && invoice.logoContentHash) {
    return invoice;
  }

  try {
    logInvoicePdfStage("stage", {
      stage: "logo_freeze",
      invoiceId: invoice.id,
      logoPresent: Boolean(readSnapshotLogoUrl(invoice)),
      lifecycleStatus: invoice.lifecycleStatus,
      pdfStatus: invoice.pdfStatus,
    });

    const frozen = await materializeImmutableInvoiceLogo({
      organizationId: invoice.organizationId,
      invoiceId: invoice.id,
      logoUrl: readSnapshotLogoUrl(invoice),
      fallbackName: readSnapshotLegalName(invoice),
    });
    if (!frozen) {
      return invoice;
    }
    const updated = await repo.rpcFreezeInvoiceLogoAsset({
      invoiceId: invoice.id,
      assetPath: frozen.assetPath,
      contentHash: frozen.contentHash,
    });
    // Preserve hydrated line items — freeze RPC returns header-only.
    return {
      ...invoice,
      logoAssetPath: updated.logoAssetPath ?? frozen.assetPath,
      logoContentHash: updated.logoContentHash ?? frozen.contentHash,
    };
  } catch (error) {
    logInvoicePdfStage("logo_freeze_failed", {
      stage: "logo_freeze",
      invoiceId: invoice.id,
      error,
    });
    // Logo failure must not block PDF generation — initials fallback.
    return invoice;
  }
}

/**
 * POST generation: atomic claim → hydrate items → logo freeze → render → upload.
 */
export async function generateIssuedInvoicePdf(
  profile: Profile,
  invoiceId: string,
  options: { force?: boolean } = {},
): Promise<{ invoice: InvoiceRecord; generated: boolean }> {
  assertInvoicePermission(profile, "invoices.view");
  const organizationId = requireOrganizationId(profile);

  // Org authorization before any service-role storage access
  const existing = await repo.getInvoiceById(organizationId, invoiceId);
  if (!existing) {
    throw new Error("Invoice not found");
  }
  assertSameOrganization(existing.organizationId, organizationId);

  if (existing.lifecycleStatus === "draft" || existing.lifecycleStatus === "void") {
    throw new Error("Issued PDF is only available for issued invoices");
  }

  logInvoicePdfStage("stage", {
    stage: "claim",
    invoiceId,
    lifecycleStatus: existing.lifecycleStatus,
    pdfStatus: existing.pdfStatus,
    itemCount: existing.items?.length ?? 0,
    templateKey: existing.templateKey,
  });

  let claim;
  try {
    claim = await repo.rpcClaimInvoicePdfGeneration({
      invoiceId,
      force: options.force ?? false,
    });
  } catch (error) {
    logInvoicePdfStage("failed", {
      stage: "claim",
      invoiceId,
      error,
    });
    throw new InvoicePdfStageError("claim", "PDF generation claim failed", {
      cause: error,
    });
  }

  if (claim.outcome === "already_ready") {
    return { invoice: claim.invoice, generated: false };
  }

  if (claim.outcome === "in_progress") {
    throw new InvoicePdfInProgressError();
  }

  const token = claim.token;
  if (!token) {
    throw new InvoicePdfStageError("claim", "PDF generation claim missing token");
  }

  let working = claim.invoice;

  try {
    // Claim return is header-only — reload items before normalization/render.
    working = await hydrateInvoiceWithItemsForPdf(organizationId, invoiceId, {
      pdfStatus: claim.invoice.pdfStatus,
      pdfGenerationToken: claim.invoice.pdfGenerationToken,
      pdfGenerationClaimedAt: claim.invoice.pdfGenerationClaimedAt,
      pdfErrorCode: claim.invoice.pdfErrorCode,
    });

    logInvoicePdfStage("stage", {
      stage: "data_normalization",
      invoiceId: working.id,
      itemCount: working.items?.length ?? 0,
      lifecycleStatus: working.lifecycleStatus,
      pdfStatus: working.pdfStatus,
      templateKey: working.templateKey,
    });

    working = await ensureFrozenLogoAsset(working);

    let data: InvoicePdfData;
    try {
      data = await buildInvoicePdfData(working, { mode: "issued" });
    } catch (error) {
      throw new InvoicePdfStageError(
        "data_normalization",
        "Issued PDF data normalization failed",
        { cause: error },
      );
    }

    logInvoicePdfStage("stage", {
      stage: "render",
      invoiceId: working.id,
      templateKey: data.theme.templateKey,
      templateVersion: data.theme.templateVersion,
      logoPresent: data.company.logo?.kind === "image",
      logoMime:
        data.company.logo?.kind === "image" ? data.company.logo.mimeType : null,
      lifecycleStatus: working.lifecycleStatus,
      pdfStatus: working.pdfStatus,
    });

    const buffer = await renderInvoicePdfBuffer(data);

    let storagePath: string;
    try {
      storagePath = await uploadInvoicePdfToStorage({
        organizationId: working.organizationId,
        invoiceId: working.id,
        templateVersion: data.theme.templateVersion,
        buffer,
      });
    } catch (error) {
      throw new InvoicePdfStageError(
        "storage_upload",
        "Failed to store invoice PDF",
        { cause: error },
      );
    }

    let updated: InvoiceRecord;
    try {
      updated = await repo.rpcCompleteInvoicePdfGeneration({
        invoiceId: working.id,
        token,
        storagePath,
      });
    } catch (error) {
      throw new InvoicePdfStageError(
        "state_complete",
        "Failed to mark invoice PDF ready",
        { cause: error },
      );
    }

    logInvoicePdfStage("generated", {
      invoiceId: working.id,
      templateKey: data.theme.templateKey,
      templateVersion: data.theme.templateVersion,
      bytes: buffer.length,
    });
    return { invoice: updated, generated: true };
  } catch (error) {
    const code = safePdfErrorCode(codeForStageError(error));
    try {
      await repo.rpcFailInvoicePdfGeneration({
        invoiceId: working.id,
        token,
        errorCode: code,
      });
    } catch (failError) {
      logInvoicePdfStage("fail_rpc_secondary", {
        stage: "state_complete",
        invoiceId: working.id,
        error: failError,
      });
    }
    logInvoicePdfStage("failed", {
      stage: error instanceof InvoicePdfStageError ? error.stage : "render",
      invoiceId: working.id,
      errorCode: code,
      lifecycleStatus: working.lifecycleStatus,
      pdfStatus: working.pdfStatus,
      templateKey: working.templateKey,
      error,
    });
    throw new InvoicePdfGenerationFailedError(code);
  }
}

/** Best-effort generation after issue — never throws to caller. */
export async function tryGenerateInvoicePdfAfterIssue(
  profile: Profile,
  invoiceId: string,
): Promise<void> {
  try {
    await generateIssuedInvoicePdf(profile, invoiceId, { force: false });
  } catch (error) {
    logInvoicePdfStage("post_issue_generate_failed", {
      invoiceId,
      error,
    });
  }
}
