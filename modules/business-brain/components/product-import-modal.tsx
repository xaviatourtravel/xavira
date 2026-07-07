"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileUp } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { formatTranslation } from "@/lib/i18n/dictionary";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import {
  buildProductImportWarnings,
  mapProductImportToFormValues,
} from "@/modules/business-brain/lib/map-product-import-to-form";
import { formatIdrCurrency } from "@/modules/business-brain/lib/parse-currency";
import { formatDepartureDatePreview } from "@/modules/business-brain/lib/parse-departure-date";
import { parseProductImportText } from "@/modules/business-brain/lib/parse-product-import-text";
import type { ParsedProductImport, ProductImportWarningKey } from "@/modules/business-brain/types/product-import";
import type { BrainProductFormValues } from "@/modules/business-brain/types/products";
import { cn } from "@/lib/utils";

type ProductImportModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: (patch: Partial<BrainProductFormValues>, parsed: ParsedProductImport) => void;
  isApplying?: boolean;
};

export function ProductImportModal({
  open,
  onClose,
  onApply,
  isApplying = false,
}: ProductImportModalProps) {
  const { bb, locale } = useBbTranslation();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedProductImport | null>(null);

  const warnings = useMemo(
    () => (parsed ? buildProductImportWarnings(parsed) : []),
    [parsed],
  );

  useEffect(() => {
    if (!open) {
      setText("");
      setParsed(null);
    }
  }, [open]);

  if (!open) return null;

  function handleParse() {
    setParsed(parseProductImportText(text));
  }

  function handleApply() {
    if (!parsed) return;
    onApply(mapProductImportToFormValues(parsed), parsed);
  }

  function handleClose() {
    setText("");
    setParsed(null);
    onClose();
  }

  function warningLabel(key: ProductImportWarningKey, parsedValue: ParsedProductImport) {
    if (key === "unknownField") {
      const firstUnknown = parsedValue.unknownFields[0];
      if (!firstUnknown) return bb("productImportWarningUnknownField");
      return formatTranslation(bb("productImportWarningUnknownFieldNamed"), {
        field: firstUnknown.key,
      });
    }

    const labels: Record<ProductImportWarningKey, string> = {
      missingProductName: bb("productImportWarningMissingName"),
      missingDestination: bb("productImportWarningMissingDestination"),
      missingStartingPrice: bb("productImportWarningMissingPrice"),
      missingDepartureDate: bb("productImportWarningMissingDeparture"),
      unknownField: bb("productImportWarningUnknownField"),
    };

    return labels[key];
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={bb("closeModal")}
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-import-modal-title"
        className={cn(
          "relative z-10 flex w-[calc(100vw-24px)] max-w-5xl flex-col overflow-hidden rounded-xl border bg-background shadow-lg",
          "max-h-[calc(100vh-24px)] sm:max-h-[calc(100vh-48px)]",
        )}
      >
        <div className="shrink-0 border-b px-5 py-4">
          <div className="flex items-start gap-3">
            <FileUp className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <h3 id="product-import-modal-title" className="text-lg font-semibold text-foreground">
                {bb("productImportModalTitle")}
              </h3>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {bb("productImportModalDescription")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-2">
          <div className="flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r">
            <div className="border-b px-5 py-3">
              <p className="text-sm font-semibold text-foreground">{bb("productImportPasteLabel")}</p>
            </div>
            <div className="min-h-0 flex-1 p-5">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={bb("productImportPlaceholder")}
                className="h-full min-h-[240px] w-full resize-none rounded-lg border border-border/70 bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring lg:min-h-[320px]"
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="border-b px-5 py-3">
              <p className="text-sm font-semibold text-foreground">{bb("productImportPreviewTitle")}</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {parsed ? (
                <div className="space-y-4">
                  <dl className="space-y-2 text-sm">
                    <PreviewRow label={bb("productName")} value={parsed.name || "—"} />
                    <PreviewRow label={bb("destination")} value={parsed.country || "—"} />
                    <PreviewRow
                      label={bb("departureDate")}
                      value={formatDepartureDatePreview(parsed.departureDate, locale)}
                    />
                    <PreviewRow
                      label={bb("productImportPreviewAdultPrice")}
                      value={formatIdrCurrency(parsed.pricing.adult)}
                    />
                    <PreviewRow
                      label={bb("productImportPreviewChildTwinPrice")}
                      value={formatIdrCurrency(parsed.pricing.childTwin)}
                    />
                    <PreviewRow
                      label={bb("productImportPreviewChildNoBedPrice")}
                      value={formatIdrCurrency(parsed.pricing.childNoBed)}
                    />
                    <PreviewRow
                      label={bb("highlights")}
                      value={String(parsed.highlights.length)}
                    />
                    <PreviewRow
                      label={bb("included")}
                      value={String(parsed.included.length)}
                    />
                    <PreviewRow
                      label={bb("excluded")}
                      value={String(parsed.excluded.length)}
                    />
                  </dl>

                  {warnings.length > 0 ? (
                    <div className="rounded-lg bg-amber-500/10 px-3 py-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-950 dark:text-amber-100">
                        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                        {bb("productImportWarningsTitle")}
                      </div>
                      <ul className="space-y-1 text-[13px] text-amber-950 dark:text-amber-100">
                        {warnings.map((warning, index) => (
                          <li key={`${warning}-${index}`}>{warningLabel(warning, parsed)}</li>
                        ))}
                        {parsed.unknownFields.slice(1).map((field) => (
                          <li key={field.key}>
                            {formatTranslation(bb("productImportWarningUnknownFieldNamed"), {
                              field: field.key,
                            })}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">{bb("productImportPreviewEmpty")}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end">
          <DsButton type="button" variant="outline" onClick={handleClose} disabled={isApplying}>
            {bb("cancel")}
          </DsButton>
          <DsButton
            type="button"
            variant="outline"
            onClick={handleParse}
            disabled={!text.trim() || isApplying}
          >
            {bb("productImportParse")}
          </DsButton>
          <DsButton type="button" onClick={handleApply} disabled={!parsed || isApplying} loading={isApplying}>
            {bb("productImportApply")}
          </DsButton>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
