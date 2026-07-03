import {
  loadBrainProductsAction,
  loadProductFaqOptionsAction,
} from "@/modules/business-brain/actions";
import { ProductsPageClient } from "@/modules/business-brain/components/products-page";

export const metadata = {
  title: "Products · Business Brain · Desklabs",
};

export default async function BusinessBrainProductsPage() {
  const [{ products, canEdit }, faqOptions] = await Promise.all([
    loadBrainProductsAction(),
    loadProductFaqOptionsAction(),
  ]);

  return (
    <ProductsPageClient
      initialProducts={products}
      faqOptions={faqOptions}
      canEdit={canEdit}
    />
  );
}
