"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import {
  createBrainProductAction,
  loadBrainProductAction,
} from "@/modules/business-brain/actions/product-actions";
import { ProductEditor } from "@/modules/business-brain/components/product-editor";
import { ProductListPanel } from "@/modules/business-brain/components/product-list-panel";
import { BusinessBrainSectionHeader } from "@/modules/business-brain/components/business-brain-workspace";
import type {
  BrainProductDetail,
  BrainProductListItem,
  BrainProductStatus,
} from "@/modules/business-brain/types/products";
import {
  translateBusinessBrainSectionDescription,
  translateBusinessBrainSectionTitle,
} from "@/lib/i18n/business-brain-labels";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

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
  const [products, setProducts] = useState(initialProducts);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    initialProducts[0]?.id ?? null,
  );
  const [selectedProduct, setSelectedProduct] = useState<BrainProductDetail | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BrainProductStatus | "all">("all");
  const [mobileShowEditor, setMobileShowEditor] = useState(false);
  const [isCreating, startCreateTransition] = useTransition();
  const [isLoadingProduct, startLoadTransition] = useTransition();

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
    <div className="space-y-6">
      <BusinessBrainSectionHeader
        title={translateBusinessBrainSectionTitle(t, "products")}
        iconSlug="products"
        description={translateBusinessBrainSectionDescription(t, "products")}
      />
      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        <div className={cn(mobileShowEditor ? "hidden lg:block" : "block")}>
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
          />
        </div>

        <div className={cn(!mobileShowEditor ? "hidden lg:block" : "block")}>
          {selectedProductId && selectedProduct && selectedProduct.id === selectedProductId ? (
            <ProductEditor
              key={selectedProduct.id}
              product={selectedProduct}
              faqOptions={faqOptions}
              canEdit={canEdit}
              onBack={() => setMobileShowEditor(false)}
              onProductUpdated={handleProductUpdated}
              onProductArchived={handleProductArchived}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {isLoadingProduct
                  ? "Loading product..."
                  : selectedProductId
                    ? "Loading product editor..."
                    : "Nothing here yet. Select a product or create one to start editing."}
              </p>
              {selectedProductId && !isLoadingProduct ? (
                <button
                  type="button"
                  className="mt-3 text-sm text-primary hover:underline"
                  onClick={() => loadProduct(selectedProductId)}
                >
                  Retry loading
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
