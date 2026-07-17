/**
 * Pure concurrency claim decision — mirrors SQL claim_invoice_pdf_generation.
 * Used by unit tests to prove only one owner can claim a fresh job.
 */

export type PdfClaimInput = {
  lifecycleStatus: string;
  pdfStatus: string;
  pdfStoragePath: string | null;
  claimedAt: Date | null;
  now: Date;
  force: boolean;
  staleAfterMs?: number;
};

export type PdfClaimDecision =
  | { outcome: "already_ready" }
  | { outcome: "in_progress" }
  | { outcome: "claimed" }
  | { outcome: "not_eligible"; reason: string };

export function decideInvoicePdfClaim(
  input: PdfClaimInput,
): PdfClaimDecision {
  if (input.lifecycleStatus !== "issued" && input.lifecycleStatus !== "sent") {
    return { outcome: "not_eligible", reason: "lifecycle" };
  }

  if (
    input.pdfStatus === "ready" &&
    !input.force &&
    input.pdfStoragePath
  ) {
    return { outcome: "already_ready" };
  }

  const staleAfterMs = input.staleAfterMs ?? 5 * 60 * 1000;
  if (
    input.pdfStatus === "generating" &&
    input.claimedAt &&
    input.now.getTime() - input.claimedAt.getTime() < staleAfterMs
  ) {
    return { outcome: "in_progress" };
  }

  return { outcome: "claimed" };
}

/** Two parallel callers: only the first decision that reaches "claimed" may own. */
export function simulateConcurrentPdfClaims(
  shared: Omit<PdfClaimInput, "force" | "now"> & { now: Date },
  forces: [boolean, boolean] = [false, false],
): [PdfClaimDecision, PdfClaimDecision] {
  const first = decideInvoicePdfClaim({ ...shared, force: forces[0] });
  // After a successful claim, state becomes generating with fresh claimedAt
  const afterFirst =
    first.outcome === "claimed"
      ? {
          ...shared,
          pdfStatus: "generating",
          claimedAt: shared.now,
        }
      : shared;
  const second = decideInvoicePdfClaim({ ...afterFirst, force: forces[1] });
  return [first, second];
}

export function decideFailPdfStatus(params: {
  priorStoragePath: string | null;
}): "ready" | "failed" {
  return params.priorStoragePath ? "ready" : "failed";
}
