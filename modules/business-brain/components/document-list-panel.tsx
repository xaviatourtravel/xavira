"use client";

import { Search, Zap } from "lucide-react";

import { DsCard } from "@/components/design-system/card";
import { DsSearchInput } from "@/components/design-system/form-controls";
import { ClientOnlyRelativeTime } from "@/components/omnichannel-inbox/client-only-relative-time";
import { formatTranslation } from "@/lib/i18n/dictionary";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import {
  bbDisplayDocumentName,
  bbDocumentStatusLabel,
  bbDocumentTypeLabel,
} from "@/modules/business-brain/lib/bb-ui-labels";
import {
  type BrainDocumentListItem,
  type BrainDocumentStatus,
  type BrainDocumentType,
} from "@/modules/business-brain/types/documents";
import { cn } from "@/lib/utils";

const TYPE_FILTERS: Array<BrainDocumentType | "all"> = ["all", "pdf", "image", "video", "url"];
const STATUS_FILTERS: Array<BrainDocumentStatus | "all"> = ["all", "draft", "published"];

type DocumentListPanelProps = {
  documents: BrainDocumentListItem[];
  selectedDocumentId: string | null;
  search: string;
  typeFilter: BrainDocumentType | "all";
  statusFilter: BrainDocumentStatus | "all";
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: BrainDocumentType | "all") => void;
  onStatusFilterChange: (value: BrainDocumentStatus | "all") => void;
  onSelectDocument: (documentId: string) => void;
};

function statusBadgeClass(status: BrainDocumentStatus) {
  if (status === "published") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
}

export function DocumentListPanel({
  documents,
  selectedDocumentId,
  search,
  typeFilter,
  statusFilter,
  onSearchChange,
  onTypeFilterChange,
  onStatusFilterChange,
  onSelectDocument,
}: DocumentListPanelProps) {
  const { bb } = useBbTranslation();
  const normalizedSearch = search.trim().toLowerCase();

  const filteredDocuments = documents.filter((document) => {
    const matchesType = typeFilter === "all" ? true : document.documentType === typeFilter;
    const matchesStatus =
      statusFilter === "all" ? true : document.status === statusFilter;
    const matchesSearch =
      !normalizedSearch ||
      document.name.toLowerCase().includes(normalizedSearch) ||
      bbDocumentTypeLabel(bb, document.documentType)
        .toLowerCase()
        .includes(normalizedSearch);

    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <DsCard className="p-4 md:p-5">
      <div className="mb-4 space-y-3">
        <h2 className="text-base font-semibold text-foreground">{bb("documentList")}</h2>
        <DsSearchInput
          placeholder={bb("searchDocuments")}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onTypeFilterChange(filter)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                typeFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {filter === "all" ? bb("allTypes") : bbDocumentTypeLabel(bb, filter)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onStatusFilterChange(filter)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {filter === "all" ? bb("allStatus") : bbDocumentStatusLabel(bb, filter)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filteredDocuments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            <Search className="mx-auto mb-2 h-5 w-5 opacity-60" />
            {bb("noDocumentsMatch")}
          </div>
        ) : (
          filteredDocuments.map((document) => {
            const selected = document.id === selectedDocumentId;

            return (
              <button
                key={document.id}
                type="button"
                onClick={() => onSelectDocument(document.id)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border bg-background hover:border-primary/30 hover:bg-muted/30",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {bbDisplayDocumentName(bb, document.name)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {bbDocumentTypeLabel(bb, document.documentType)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      statusBadgeClass(document.status),
                    )}
                  >
                    {bbDocumentStatusLabel(bb, document.status)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {formatTranslation(bb("productsCount"), {
                      count: document.linkedProductCount,
                    })}
                  </span>
                  {document.autoSendEnabled ? (
                    <span className="inline-flex items-center gap-1 text-primary">
                      <Zap className="h-3.5 w-3.5" />
                      {bb("autoSend")}
                    </span>
                  ) : null}
                  <span>
                    {bb("updated")}{" "}
                    <ClientOnlyRelativeTime date={document.updatedAt} className="inline" />
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </DsCard>
  );
}
