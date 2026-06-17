"use client";

import { ContentCopyButton } from "@/components/content/content-copy-button";
import { Button } from "@/components/ui/button";
import {
  formatContentStudioList,
  getContentStudioSourceBadgeClassName,
  getContentStudioSourceLabel,
} from "@/lib/ai/content-studio";
import {
  formatGenerationDateTime,
  type ContentGenerationListItem,
} from "@/lib/content/generations";
import { cn } from "@/lib/utils";

type ContentGenerationDetailModalProps = {
  generation: ContentGenerationListItem;
  onClose: () => void;
};

function OutputBlock({ title, content }: { title: string; content: string }) {
  return (
    <section className="space-y-2 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h4 className="text-sm font-semibold">{title}</h4>
        <ContentCopyButton text={content} />
      </div>
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
        {content}
      </pre>
    </section>
  );
}

export function ContentGenerationDetailModal({
  generation,
  onClose,
}: ContentGenerationDetailModalProps) {
  const { result } = generation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Tutup modal"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border bg-background shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generation-detail-title"
      >
        <div className="border-b px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="generation-detail-title" className="text-lg font-semibold">
              Generation Detail
            </h3>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                getContentStudioSourceBadgeClassName(generation.sourceType),
              )}
            >
              {getContentStudioSourceLabel(generation.sourceType)}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {generation.subjectLabel} · {generation.platformLabel} ·{" "}
            {formatGenerationDateTime(generation.createdAt)}
          </p>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-4">
          <OutputBlock
            title="Ideas"
            content={formatContentStudioList(result.contentIdeas)}
          />
          <OutputBlock
            title="Hooks"
            content={formatContentStudioList(result.hooks)}
          />
          <OutputBlock title="VO Script" content={result.voScript} />
          <OutputBlock title="Caption" content={result.caption} />
          <OutputBlock title="CTA" content={result.cta} />
          <OutputBlock
            title="Thumbnail Concept"
            content={result.thumbnailConcept}
          />
          <OutputBlock title="Image Prompt" content={result.imagePrompt} />
        </div>

        <div className="flex justify-end border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
