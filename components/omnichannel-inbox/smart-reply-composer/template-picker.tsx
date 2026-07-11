"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import {
  AURORA_SMART_REPLY_MODAL,
  AURORA_SMART_REPLY_MODAL_OVERLAY,
  AURORA_SMART_REPLY_SEARCH,
} from "@/components/workspace/aurora-tokens";

import type { SmartReplyLabels, TemplateItem } from "./types";

type TemplatePickerProps = {
  open: boolean;
  templates: TemplateItem[];
  labels: Pick<SmartReplyLabels, "templatePickerTitle" | "templateSearchPlaceholder">;
  onClose?: () => void;
  onSelect?: (template: TemplateItem) => void;
};

export function TemplatePicker({
  open,
  templates,
  labels,
  onClose,
  onSelect,
}: TemplatePickerProps) {
  const [query, setQuery] = useState("");

  const filteredTemplates = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return templates;
    }

    return templates.filter(
      (template) =>
        template.title.toLowerCase().includes(normalized) ||
        template.preview?.toLowerCase().includes(normalized),
    );
  }, [query, templates]);

  if (!open) {
    return null;
  }

  return (
    <div className={AURORA_SMART_REPLY_MODAL_OVERLAY} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={labels.templatePickerTitle}
        className={AURORA_SMART_REPLY_MODAL}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/15 px-4 py-3">
          <h3 className="text-sm font-medium text-foreground">{labels.templatePickerTitle}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.templateSearchPlaceholder}
          className={AURORA_SMART_REPLY_SEARCH}
        />

        <ul className="max-h-[320px] overflow-y-auto py-1">
          {filteredTemplates.map((template) => (
            <li key={template.id}>
              <button
                type="button"
                className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-muted/20"
                onClick={() => onSelect?.(template)}
              >
                <span className="text-sm font-medium text-foreground">{template.title}</span>
                {template.preview ? (
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {template.preview}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
