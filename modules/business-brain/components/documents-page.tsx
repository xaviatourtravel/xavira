"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { loadBrainDocumentAction } from "@/modules/business-brain/actions/document-actions";
import { DocumentDetailsPanel } from "@/modules/business-brain/components/document-details-panel";
import { DocumentListPanel } from "@/modules/business-brain/components/document-list-panel";
import { DocumentUploadZone } from "@/modules/business-brain/components/document-upload-zone";
import {
  BusinessBrainContentShell,
  BusinessBrainDetailEmptyState,
  BusinessBrainMasterDetailLayout,
} from "@/modules/business-brain/components/business-brain-content-shell";
import { BusinessBrainSectionHeader } from "@/modules/business-brain/components/business-brain-workspace";
import type {
  BrainDocumentDetail,
  BrainDocumentListItem,
  BrainDocumentStatus,
  BrainDocumentType,
} from "@/modules/business-brain/types/documents";
import {
  translateBusinessBrainSectionDescription,
  translateBusinessBrainSectionTitle,
} from "@/lib/i18n/business-brain-labels";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";

type ProductOption = { id: string; name: string };
type ArticleOption = { id: string; title: string };

type DocumentsPageClientProps = {
  initialDocuments: BrainDocumentListItem[];
  productOptions: ProductOption[];
  articleOptions: ArticleOption[];
  canEdit: boolean;
};

export function DocumentsPageClient({
  initialDocuments,
  productOptions,
  articleOptions,
  canEdit,
}: DocumentsPageClientProps) {
  const { t } = useTranslation();
  const { bb } = useBbTranslation();
  const [documents, setDocuments] = useState(initialDocuments);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    initialDocuments[0]?.id ?? null,
  );
  const [selectedDocument, setSelectedDocument] = useState<BrainDocumentDetail | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<BrainDocumentType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<BrainDocumentStatus | "all">("all");
  const [mobileShowDetails, setMobileShowDetails] = useState(false);
  const [isLoadingDocument, startLoadTransition] = useTransition();

  const refreshListItem = useCallback((document: BrainDocumentDetail) => {
    setDocuments((current) => {
      const nextItem: BrainDocumentListItem = {
        id: document.id,
        name: document.name || "Untitled Document",
        documentType: document.documentType,
        status: document.status,
        autoSendEnabled: document.autoSendEnabled,
        linkedProductCount: document.relatedProducts.length,
        updatedAt: document.updatedAt,
        createdAt: document.createdAt,
      };

      const exists = current.some((item) => item.id === document.id);
      if (!exists) {
        return [nextItem, ...current];
      }

      return current.map((item) => (item.id === document.id ? nextItem : item));
    });
  }, []);

  const loadDocument = useCallback((documentId: string) => {
    startLoadTransition(async () => {
      const result = await loadBrainDocumentAction(documentId);
      if (result.document) {
        setSelectedDocument(result.document);
        refreshListItem(result.document);
      }
    });
  }, [refreshListItem]);

  const handleSelectDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setMobileShowDetails(true);
    loadDocument(documentId);
  };

  const handleUploaded = (documentId: string) => {
    handleSelectDocument(documentId);
  };

  const handleDocumentUpdated = (document: BrainDocumentDetail) => {
    setSelectedDocument(document);
    refreshListItem(document);
  };

  const handleDocumentDeleted = (documentId: string) => {
    setDocuments((current) => current.filter((item) => item.id !== documentId));
    setSelectedDocument(null);
    setSelectedDocumentId(null);
    setMobileShowDetails(false);
  };

  useEffect(() => {
    if (selectedDocumentId && !selectedDocument) {
      loadDocument(selectedDocumentId);
    }
  }, [loadDocument, selectedDocument, selectedDocumentId]);

  return (
    <BusinessBrainContentShell>
      <BusinessBrainSectionHeader
        title={translateBusinessBrainSectionTitle(t, "documents")}
        iconSlug="documents"
        description={translateBusinessBrainSectionDescription(t, "documents")}
      />
      <BusinessBrainMasterDetailLayout
        mobileShowDetail={mobileShowDetails}
        list={
          <div className="space-y-3">
            {canEdit ? <DocumentUploadZone canEdit={canEdit} onUploaded={handleUploaded} /> : null}
            <DocumentListPanel
              documents={documents}
              selectedDocumentId={selectedDocumentId}
              search={search}
              typeFilter={typeFilter}
              statusFilter={statusFilter}
              onSearchChange={setSearch}
              onTypeFilterChange={setTypeFilter}
              onStatusFilterChange={setStatusFilter}
              onSelectDocument={handleSelectDocument}
            />
          </div>
        }
        detail={
          selectedDocumentId && selectedDocument && selectedDocument.id === selectedDocumentId ? (
            <DocumentDetailsPanel
              key={selectedDocument.id}
              document={selectedDocument}
              productOptions={productOptions}
              articleOptions={articleOptions}
              canEdit={canEdit}
              onBack={() => setMobileShowDetails(false)}
              onDocumentUpdated={handleDocumentUpdated}
              onDocumentDeleted={handleDocumentDeleted}
            />
          ) : (
            <BusinessBrainDetailEmptyState
              message={
                isLoadingDocument
                  ? bb("loadingDocument")
                  : selectedDocumentId
                    ? bb("loadingDocumentDetails")
                    : bb("documentsEmptyState")
              }
              actionLabel={
                selectedDocumentId && !isLoadingDocument ? bb("retryLoading") : undefined
              }
              onAction={
                selectedDocumentId && !isLoadingDocument
                  ? () => loadDocument(selectedDocumentId)
                  : undefined
              }
            />
          )
        }
      />
    </BusinessBrainContentShell>
  );
}
