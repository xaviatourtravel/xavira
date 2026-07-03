import { createClient } from "@/utils/supabase/server";

import type { ProductFaqLinkRecord } from "@/modules/business-brain/types/products";

export async function listProductFaqLinks(
  productId: string,
): Promise<ProductFaqLinkRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_faq_links")
    .select(
      "id, product_id, knowledge_entry_id, created_at, knowledge_entries ( title, category )",
    )
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const knowledge = row.knowledge_entries as
      | { title: string; category: string }
      | { title: string; category: string }[]
      | null;

    const entry = Array.isArray(knowledge) ? knowledge[0] : knowledge;

    return {
      id: row.id,
      productId: row.product_id,
      knowledgeEntryId: row.knowledge_entry_id,
      knowledgeTitle: entry?.title ?? "Untitled FAQ",
      knowledgeCategory: entry?.category ?? "faq",
      createdAt: row.created_at,
    };
  });
}

export async function insertProductFaqLink(
  productId: string,
  knowledgeEntryId: string,
): Promise<ProductFaqLinkRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_faq_links")
    .insert({
      product_id: productId,
      knowledge_entry_id: knowledgeEntryId,
    })
    .select("id, product_id, knowledge_entry_id, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    productId: data.product_id,
    knowledgeEntryId: data.knowledge_entry_id,
    knowledgeTitle: "FAQ",
    knowledgeCategory: "faq",
    createdAt: data.created_at,
  };
}

export async function deleteProductFaqLink(linkId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_faq_links")
    .delete()
    .eq("id", linkId);

  if (error) {
    throw new Error(error.message);
  }
}
