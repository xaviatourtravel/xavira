import { createClient } from "@/utils/supabase/server";

import type {
  BrainDocumentRelatedArticle,
  BrainDocumentRelatedProduct,
} from "@/modules/business-brain/types/documents";

export async function listDocumentProductLinks(
  documentId: string,
): Promise<BrainDocumentRelatedProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_document_products")
    .select("id, product_id, brain_products ( name )")
    .eq("document_id", documentId)
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

export async function replaceDocumentProductLinks(
  documentId: string,
  productIds: string[],
): Promise<void> {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("brain_document_products")
    .delete()
    .eq("document_id", documentId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (productIds.length === 0) return;

  const { error: insertError } = await supabase.from("brain_document_products").insert(
    productIds.map((productId) => ({
      document_id: documentId,
      product_id: productId,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function listDocumentArticleLinks(
  documentId: string,
): Promise<BrainDocumentRelatedArticle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_document_articles")
    .select("id, article_id, brain_articles ( title )")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const article = row.brain_articles as
      | { title: string }
      | { title: string }[]
      | null;
    const articleRow = Array.isArray(article) ? article[0] : article;

    return {
      id: row.id,
      articleId: row.article_id,
      articleTitle: articleRow?.title ?? "Untitled Article",
    };
  });
}

export async function replaceDocumentArticleLinks(
  documentId: string,
  articleIds: string[],
): Promise<void> {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("brain_document_articles")
    .delete()
    .eq("document_id", documentId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (articleIds.length === 0) return;

  const { error: insertError } = await supabase.from("brain_document_articles").insert(
    articleIds.map((articleId) => ({
      document_id: documentId,
      article_id: articleId,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}
