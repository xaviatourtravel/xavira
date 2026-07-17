"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/use-translation";

type InvoicePdfPreviewProps = {
  invoiceId: string;
  mode: "draft" | "issued";
  downloadEnabled?: boolean;
  initialOpen?: boolean;
};

export function InvoicePdfPreview({
  invoiceId,
  mode,
  downloadEnabled = mode === "issued",
  initialOpen = false,
}: InvoicePdfPreviewProps) {
  const { tStrict } = useTranslation();
  const [open, setOpen] = useState(initialOpen);
  const [nonce, setNonce] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pdfUrl =
    mode === "draft"
      ? `/api/finance/invoices/${invoiceId}/pdf?preview=1&n=${nonce}`
      : `/api/finance/invoices/${invoiceId}/pdf?n=${nonce}`;
  const downloadUrl = `/api/finance/invoices/${invoiceId}/pdf?download=1`;
  const generateUrl = `/api/finance/invoices/${invoiceId}/pdf/generate`;

  async function requestGenerate(force: boolean) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(generateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      if (!response.ok) {
        setError(tStrict("financeUi.pdfRetryFailed"));
        return false;
      }
      setOpen(true);
      setNonce((value) => value + 1);
      return true;
    } catch {
      setError(tStrict("financeUi.pdfRetryFailed"));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => {
            setError(null);
            if (mode === "issued") {
              void requestGenerate(false);
              return;
            }
            setOpen(true);
            setNonce((value) => value + 1);
          }}
        >
          {tStrict("financeUi.previewInvoice")}
        </Button>
        {downloadEnabled ? (
          <a
            href={downloadUrl}
            className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            {tStrict("financeUi.downloadPdf")}
          </a>
        ) : null}
        {mode === "issued" ? (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              void requestGenerate(true);
            }}
          >
            {tStrict("financeUi.retryPdf")}
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="overflow-hidden rounded-xl border bg-muted/20">
          {error ? (
            <div className="space-y-2 p-4">
              <p className="text-sm text-rose-700" role="alert">
                {error}
              </p>
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() => {
                  if (mode === "issued") {
                    void requestGenerate(true);
                    return;
                  }
                  setError(null);
                  setNonce((value) => value + 1);
                }}
              >
                {tStrict("financeUi.retryPdf")}
              </Button>
            </div>
          ) : (
            <iframe
              title={tStrict("financeUi.previewInvoice")}
              src={pdfUrl}
              className="h-[70vh] w-full bg-white"
              onError={() => setError(tStrict("financeUi.pdfLoadFailed"))}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
