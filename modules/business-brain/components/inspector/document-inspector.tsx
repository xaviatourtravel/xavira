"use client";

import { FileText } from "lucide-react";

import { BusinessBrainInspector } from "@/modules/business-brain/components/business-brain-inspector";
import {
  InspectorBadge,
  InspectorEmptyState,
  InspectorList,
  InspectorSection,
} from "@/modules/business-brain/components/inspector/inspector-primitives";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import {
  bbDisplayDocumentName,
  bbDocumentStatusLabel,
  bbDocumentTriggerLabel,
  bbDocumentTypeLabel,
} from "@/modules/business-brain/lib/bb-ui-labels";
import type { BrainDocumentDetail } from "@/modules/business-brain/types/documents";

type DocumentInspectorProps = {
  document: BrainDocumentDetail | null;
};

export function DocumentInspector({ document }: DocumentInspectorProps) {
  const { bb } = useBbTranslation();

  if (!document) {
    return (
      <BusinessBrainInspector
        title={bb("documentDelivery")}
        subtitle={bb("documentDeliverySubtitle")}
        icon={FileText}
      >
        <InspectorEmptyState message={bb("selectDocumentInspector")} />
      </BusinessBrainInspector>
    );
  }

  const fileLabel = document.storagePath?.split("/").pop() ?? document.publicUrl ?? null;

  return (
    <BusinessBrainInspector
      title={bb("documentDelivery")}
      subtitle={bb("documentDeliverySubtitle")}
      icon={FileText}
      contentKey={`${document.id}-${document.updatedAt}`}
    >
      <InspectorSection title={bb("preview")}>
        <p className="text-sm font-medium text-foreground">
          {bbDisplayDocumentName(bb, document.name)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {bbDocumentTypeLabel(bb, document.documentType)} ·{" "}
          {bbDocumentStatusLabel(bb, document.status)}
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

      <InspectorSection title={bb("relatedProducts")}>
        {document.relatedProducts.length > 0 ? (
          <InspectorList
            items={document.relatedProducts.map((item) => ({
              id: item.id,
              label: item.productName,
            }))}
          />
        ) : (
          <InspectorEmptyState message={bb("noLinkedProducts")} />
        )}
      </InspectorSection>

      <InspectorSection title={bb("autoSendTriggers")}>
        {document.autoSendEnabled && document.triggers.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {document.triggers.map((trigger) => (
              <InspectorBadge key={trigger} variant="default">
                {bbDocumentTriggerLabel(bb, trigger)}
              </InspectorBadge>
            ))}
          </div>
        ) : (
          <InspectorEmptyState
            message={
              document.autoSendEnabled ? bb("autoSendNoTriggers") : bb("autoSendDisabled")
            }
          />
        )}
      </InspectorSection>

      <InspectorSection title={bb("aiConditions")}>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {document.aiNotes.trim() || bb("noAiConditions")}
        </p>
      </InspectorSection>
    </BusinessBrainInspector>
  );
}
