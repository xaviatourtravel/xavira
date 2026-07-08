"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import {
  createBrainProductAction,
  importProductFaqsAction,
  loadBrainProductAction,
} from "@/modules/business-brain/actions/product-actions";
import { ProductEditor } from "@/modules/business-brain/components/product-editor";
import { ProductImportModal } from "@/modules/business-brain/components/product-import-modal";
import { ProductListPanel } from "@/modules/business-brain/components/product-list-panel";
import {
  BusinessBrainContentShell,
  BusinessBrainDetailEmptyState,
  BusinessBrainMasterDetailLayout,
} from "@/modules/business-brain/components/business-brain-content-shell";
import { BusinessBrainSectionHeader } from "@/modules/business-brain/components/business-brain-workspace";
import { mapParsedFaqsToApplyItems } from "@/modules/business-brain/lib/parse-faq-import-text";
import type {
  BrainProductDetail,
  BrainProductFormValues,
  BrainProductListItem,
  BrainProductStatus,
} from "@/modules/business-brain/types/products";
import {
  translateBusinessBrainSectionDescription,
  translateBusinessBrainSectionTitle,
} from "@/lib/i18n/business-brain-labels";
import { formatTranslation } from "@/lib/i18n/dictionary";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";

type FaqOption = {
  id: string;
  title: string;
  category: string;
};

type ProductsPageClientProps = {
  initialProducts: BrainProductListItem[];
  faqOptions: FaqOption[];
  canEdit: boolean;
};

export function ProductsPageClient({
  initialProducts,
  faqOptions,
  canEdit,
}: ProductsPageClientProps) {
  const { t } = useTranslation();
  const { bb } = useBbTranslation();
  const [products, setProducts] = useState(initialProducts);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    initialProducts[0]?.id ?? null,
  );
  const [selectedProduct, setSelectedProduct] = useState<BrainProductDetail | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BrainProductStatus | "all">("all");
  const [mobileShowEditor, setMobileShowEditor] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importPatch, setImportPatch] = useState<Partial<BrainProductFormValues> | null>(null);
  const [importRequestId, setImportRequestId] = useState(0);
  const [isCreating, startCreateTransition] = useTransition();
  const [isLoadingProduct, startLoadTransition] = useTransition();
  const [isApplyingImport, startApplyImportTransition] = useTransition();

  const refreshListItem = useCallback((product: BrainProductDetail) => {
    setProducts((current) => {
      const nextItem: BrainProductListItem = {
        id: product.id,
        name: product.name || "Untitled Product",
        category: product.category,
        destination: product.destination,
        status: product.status,
        updatedAt: product.updatedAt,
        knowledgeScore: product.knowledgeScore,
        documentCount: product.documents.length,
        faqCount: product.faqLinks.length,
      };

      const exists = current.some((item) => item.id === product.id);
      if (!exists) {
        return [nextItem, ...current];
      }

      return current.map((item) => (item.id === product.id ? nextItem : item));
    });
  }, []);

  const loadProduct = useCallback((productId: string) => {
    startLoadTransition(async () => {
      const result = await loadBrainProductAction(productId);
      if (result.product) {
        setSelectedProduct(result.product);
        refreshListItem(result.product);
      }
    });
  }, [refreshListItem]);

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setMobileShowEditor(true);
    loadProduct(productId);
  };

  const handleCreateProduct = () => {
    startCreateTransition(async () => {
      const result = await createBrainProductAction();
      if (!result.ok || !result.product) {
        return;
      }
      refreshListItem(result.product);
      setSelectedProductId(result.product.id);
      setSelectedProduct(result.product);
      setMobileShowEditor(true);
    });
  };

  const applyImportPatch = (patch: Partial<BrainProductFormValues>) => {
    setImportPatch(patch);
    setImportRequestId((current) => current + 1);
    setImportOpen(false);
    setMobileShowEditor(true);
  };

  const handleApplyImport = (payload: {
    patch: Partial<BrainProductFormValues>;
    importFaqs: boolean;
    faqImport: { faqs: Array<{ question: string; answer: string; nextStep?: string; triggerPhrases: string[] }> } | null;
  }) => {
    startApplyImportTransition(async () => {
      const applyFaqsForProduct = async (productId: string) => {
        if (!payload.importFaqs || !payload.faqImport?.faqs.length) {
          return null;
        }

        const result = await importProductFaqsAction(
          productId,
          mapParsedFaqsToApplyItems(payload.faqImport.faqs),
        );

        if (!result.ok) {
          window.alert(result.error);
          return null;
        }

        return result;
      };

      if (selectedProductId && selectedProduct) {
        if (!window.confirm(bb("productImportApplyConfirm"))) {
          return;
        }

        applyImportPatch(payload.patch);
        const faqResult = await applyFaqsForProduct(selectedProduct.id);
        if (faqResult?.product) {
          setSelectedProduct(faqResult.product);
          refreshListItem(faqResult.product);
          if (faqResult.result.created > 0) {
            window.alert(
              faqResult.result.skippedDuplicates > 0
                ? formatTranslation(bb("faqImportAppliedWithSkipped"), {
                    created: String(faqResult.result.created),
                    skipped: String(faqResult.result.skippedDuplicates),
                  })
                : formatTranslation(bb("faqImportApplied"), {
                    count: String(faqResult.result.created),
                  }),
            );
          }
        }
        return;
      }

      const result = await createBrainProductAction();
      if (!result.ok || !result.product) {
        return;
      }

      refreshListItem(result.product);
      setSelectedProductId(result.product.id);
      setSelectedProduct(result.product);
      applyImportPatch(payload.patch);

      const faqResult = await applyFaqsForProduct(result.product.id);
      if (faqResult?.product) {
        setSelectedProduct(faqResult.product);
        refreshListItem(faqResult.product);
      }
    });
  };

  const handleProductUpdated = (product: BrainProductDetail) => {
    setSelectedProduct(product);
    refreshListItem(product);
  };

  const handleProductArchived = (productId: string) => {
    setProducts((current) =>
      current.map((item) =>
        item.id === productId ? { ...item, status: "archived" } : item,
      ),
    );
    if (selectedProduct?.id === productId) {
      setSelectedProduct((current) =>
        current ? { ...current, status: "archived" } : current,
      );
    }
  };

  useEffect(() => {
    if (selectedProductId && !selectedProduct) {
      loadProduct(selectedProductId);
    }
  }, [loadProduct, selectedProduct, selectedProductId]);

  return (
    <BusinessBrainContentShell>
      <BusinessBrainSectionHeader
        title={translateBusinessBrainSectionTitle(t, "products")}
        iconSlug="products"
        description={translateBusinessBrainSectionDescription(t, "products")}
      />
      <BusinessBrainMasterDetailLayout
        mobileShowDetail={mobileShowEditor}
        list={
          <ProductListPanel
            products={products}
            selectedProductId={selectedProductId}
            search={search}
            statusFilter={statusFilter}
            canEdit={canEdit}
            isCreating={isCreating}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
            onSelectProduct={handleSelectProduct}
            onCreateProduct={handleCreateProduct}
            onImportFromText={canEdit ? () => setImportOpen(true) : undefined}
          />
        }
        detail={
          selectedProductId && selectedProduct && selectedProduct.id === selectedProductId ? (
            <ProductEditor
              key={selectedProduct.id}
              product={selectedProduct}
              faqOptions={faqOptions}
              canEdit={canEdit}
              onBack={() => setMobileShowEditor(false)}
              onProductUpdated={handleProductUpdated}
              onProductArchived={handleProductArchived}
              importPatch={importPatch}
              importRequestId={importRequestId}
              onImportApplied={() => setImportPatch(null)}
            />
          ) : (
            <BusinessBrainDetailEmptyState
              message={
                isLoadingProduct
                  ? bb("loadingProduct")
                  : selectedProductId
                    ? bb("loadingProductEditor")
                    : bb("productsEmptyState")
              }
              actionLabel={
                selectedProductId && !isLoadingProduct ? bb("retryLoading") : undefined
              }
              onAction={
                selectedProductId && !isLoadingProduct
                  ? () => loadProduct(selectedProductId)
                  : undefined
              }
            />
          )
        }
      />

      <ProductImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onApply={handleApplyImport}
        isApplying={isApplyingImport}
      />
    </BusinessBrainContentShell>
  );
}
