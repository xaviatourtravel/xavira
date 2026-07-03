import { createClient } from "@/utils/supabase/server";

import type { BrainArticleRelatedProduct } from "@/modules/business-brain/types/knowledge";

export async function listArticleProductLinks(
  articleId: string,
): Promise<BrainArticleRelatedProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_article_products")
    .select("id, product_id, brain_products ( name )")
    .eq("article_id", articleId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const product = row.brain_products as
      | { name: string }
      | { name: string }[]
      | null;
    const productRow = Array.isArray(product) ? product[0] : product;

    return {
      id: row.id,
      productId: row.product_id,
      productName: productRow?.name ?? "Untitled Product",
    };
  });
}

export async function replaceArticleProductLinks(
  articleId: string,
  productIds: string[],
): Promise<void> {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("brain_article_products")
    .delete()
    .eq("article_id", articleId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (productIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from("brain_article_products").insert(
    productIds.map((productId) => ({
      article_id: articleId,
      product_id: productId,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}
