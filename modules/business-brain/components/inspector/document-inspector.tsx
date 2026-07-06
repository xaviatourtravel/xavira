"use client";

import { FileText } from "lucide-react";

import { BusinessBrainInspector } from "@/modules/business-brain/components/business-brain-inspector";
import {
  InspectorBadge,
  InspectorEmptyState,
  InspectorList,
  InspectorSection,
} from "@/modules/business-brain/components/inspector/inspector-primitives";
import {
  BRAIN_DOCUMENT_STATUS_LABELS,
  BRAIN_DOCUMENT_TRIGGER_LABELS,
  BRAIN_DOCUMENT_TYPE_LABELS,
  type BrainDocumentDetail,
} from "@/modules/business-brain/types/documents";

type DocumentInspectorProps = {
  document: BrainDocumentDetail | null;
};

export function DocumentInspector({ document }: DocumentInspectorProps) {
  if (!document) {
    return (
      <BusinessBrainInspector
        title="Document Delivery"
        subtitle="How AI sends and references this document."
        icon={FileText}
      >
        <InspectorEmptyState message="Select a document to preview delivery rules." />
      </BusinessBrainInspector>
    );
  }

  const fileLabel = document.storagePath?.split("/").pop() ?? document.publicUrl ?? null;

  return (
    <BusinessBrainInspector
      title="Document Delivery"
      subtitle="How AI sends and references this document."
      icon={FileText}
      contentKey={`${document.id}-${document.updatedAt}`}
    >
      <InspectorSection title="Preview">
        <p className="text-sm font-medium text-foreground">
          {document.name || "Untitled Document"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {BRAIN_DOCUMENT_TYPE_LABELS[document.documentType]} ·{" "}
          {BRAIN_DOCUMENT_STATUS_LABELS[document.status]}
        </p>
        {document.description ? (
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            {document.description}
          </p>
        ) : null}
        {fileLabel ? (
          <p className="mt-2 text-xs text-muted-foreground">{fileLabel}</p>
        ) : null}
      </InspectorSection>

      <InspectorSection title="Linked Products">
        {document.relatedProducts.length > 0 ? (
          <InspectorList
            items={document.relatedProducts.map((item) => ({
              id: item.id,
              label: item.productName,
            }))}
          />
        ) : (
          <InspectorEmptyState message="No linked products." />
        )}
      </InspectorSection>

      <InspectorSection title="Auto Send Triggers">
        {document.autoSendEnabled && document.triggers.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {document.triggers.map((trigger) => (
              <InspectorBadge key={trigger} variant="default">
                {BRAIN_DOCUMENT_TRIGGER_LABELS[trigger]}
              </InspectorBadge>
            ))}
          </div>
        ) : (
          <InspectorEmptyState
            message={
              document.autoSendEnabled
                ? "Auto-send enabled but no triggers configured."
                : "Auto-send is disabled."
            }
          />
        )}
      </InspectorSection>

      <InspectorSection title="AI Conditions">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {document.aiNotes.trim() ||
            "No custom AI conditions. Document is sent when triggers match customer intent."}
        </p>
      </InspectorSection>
    </BusinessBrainInspector>
  );
}
