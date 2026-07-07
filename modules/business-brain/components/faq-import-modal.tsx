"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, MessageSquareText } from "lucide-react";

import { DsButton } from "@/components/design-system/button";
import { formatTranslation } from "@/lib/i18n/dictionary";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import {
  detectDuplicateFaqQuestions,
  parseFaqImportText,
  summarizeFaqImport,
} from "@/modules/business-brain/lib/parse-faq-import-text";
import type { ParsedFaqImport } from "@/modules/business-brain/types/faq-import";
import { cn } from "@/lib/utils";

type FaqImportModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: (parsed: ParsedFaqImport) => void;
  existingQuestions?: string[];
  isApplying?: boolean;
};

export function FaqImportModal({
  open,
  onClose,
  onApply,
  existingQuestions = [],
  isApplying = false,
}: FaqImportModalProps) {
  const { bb } = useBbTranslation();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedFaqImport | null>(null);

  useEffect(() => {
    if (!open) {
      setText("");
      setParsed(null);
    }
  }, [open]);

  const summary = useMemo(
    () => (parsed ? summarizeFaqImport(parsed) : null),
    [parsed],
  );

  const duplicateQuestions = useMemo(() => {
    if (!parsed) return [];
    return detectDuplicateFaqQuestions(parsed.faqs, existingQuestions);
  }, [existingQuestions, parsed]);

  if (!open) return null;

  function handleParse() {
    setParsed(parseFaqImportText(text));
  }

  function handleApply() {
    if (!parsed || parsed.faqs.length === 0) return;
    onApply(parsed);
  }

  function handleClose() {
    setText("");
    setParsed(null);
    onClose();
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
        aria-labelledby="faq-import-modal-title"
        className={cn(
          "relative z-10 flex w-[calc(100vw-24px)] max-w-5xl flex-col overflow-hidden rounded-xl border bg-background shadow-lg",
          "max-h-[calc(100vh-24px)] sm:max-h-[calc(100vh-48px)]",
        )}
      >
        <div className="shrink-0 border-b px-5 py-4">
          <div className="flex items-start gap-3">
            <MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <h3 id="faq-import-modal-title" className="text-lg font-semibold text-foreground">
                {bb("faqImportModalTitle")}
              </h3>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {bb("faqImportModalDescription")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-2">
          <div className="flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r">
            <div className="border-b px-5 py-3">
              <p className="text-sm font-semibold text-foreground">{bb("faqImportPasteLabel")}</p>
            </div>
            <div className="min-h-0 flex-1 p-5">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={bb("faqImportPlaceholder")}
                className="h-full min-h-[240px] w-full resize-none rounded-lg border border-border/70 bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring lg:min-h-[320px]"
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="border-b px-5 py-3">
              <p className="text-sm font-semibold text-foreground">{bb("faqImportPreviewTitle")}</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {parsed ? (
                <div className="space-y-4">
                  <div className="space-y-1 text-sm text-foreground">
                    <p>
                      {formatTranslation(bb("faqImportSummaryFound"), {
                        count: String(summary?.total ?? 0),
                      })}
                    </p>
                    {(summary?.missingTriggerPhrases ?? 0) > 0 ? (
                      <p className="text-muted-foreground">
                        {formatTranslation(bb("faqImportSummaryMissingTriggers"), {
                          count: String(summary?.missingTriggerPhrases ?? 0),
                        })}
                      </p>
                    ) : null}
                    {duplicateQuestions.length > 0 ? (
                      <p className="text-amber-800 dark:text-amber-200">
                        {formatTranslation(bb("faqImportSummaryDuplicates"), {
                          count: String(duplicateQuestions.length),
                        })}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">{bb("faqImportSummaryNoDuplicates")}</p>
                    )}
                    {parsed.warnings.length > 0 ? (
                      <p className="text-muted-foreground">
                        {formatTranslation(bb("faqImportSummaryWarnings"), {
                          count: String(parsed.warnings.length),
                        })}
                      </p>
                    ) : null}
                  </div>

                  <ul className="space-y-3">
                    {parsed.faqs.slice(0, 5).map((faq, index) => (
                      <li
                        key={`${faq.id ?? "faq"}-${index}`}
                        className="rounded-lg border border-border/70 px-3 py-2.5"
                      >
                        <p className="text-sm font-medium text-foreground">{faq.question}</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                          <span>
                            {formatTranslation(bb("faqImportPreviewTriggerCount"), {
                              count: String(faq.triggerPhrases.length),
                            })}
                          </span>
                          <span>{bb("faqImportPreviewAnswer")}: {truncatePreview(faq.answer)}</span>
                          <span>
                            {faq.nextStep?.trim()
                              ? bb("faqImportPreviewHasNextStep")
                              : bb("faqImportPreviewNoNextStep")}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {parsed.ignoredSections.length > 0 ? (
                    <div className="rounded-lg bg-amber-500/10 px-3 py-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-950 dark:text-amber-100">
                        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                        {bb("faqImportIgnoredSectionsTitle")}
                      </div>
                      <p className="text-[13px] text-amber-950 dark:text-amber-100">
                        {formatTranslation(bb("faqImportIgnoredSectionsCount"), {
                          count: String(parsed.ignoredSections.length),
                        })}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">{bb("faqImportPreviewEmpty")}</p>
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
            {bb("faqImportParse")}
          </DsButton>
          <DsButton
            type="button"
            onClick={handleApply}
            disabled={!parsed || parsed.faqs.length === 0 || isApplying}
            loading={isApplying}
          >
            {bb("faqImportApply")}
          </DsButton>
        </div>
      </div>
    </div>
  );
}

function truncatePreview(value: string, maxLength = 72) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}
