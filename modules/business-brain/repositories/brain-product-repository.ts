import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

import {
  coerceProductStatus,
  parseDepartureItems,
  parsePricingItems,
  parseStringArray,
  toListItem,
} from "@/modules/business-brain/lib/product-knowledge-score";
import type {
  BrainProductFormValues,
  BrainProductListItem,
  BrainProductStatus,
} from "@/modules/business-brain/types/products";

export type BrainProductRow = {
  id: string;
  business_brain_id: string;
  name: string;
  category: string;
  destination: string;
  description: string;
  highlights: Json;
  pricing: Json;
  departures: Json;
  included: Json;
  excluded: Json;
  ai_notes: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function mapFormValues(row: BrainProductRow): BrainProductFormValues {
  return {
    name: row.name,
    category: row.category as BrainProductFormValues["category"],
    destination: row.destination,
    status: coerceProductStatus(row.status),
    description: row.description,
    highlights: parseStringArray(row.highlights),
    pricing: parsePricingItems(row.pricing),
    departures: parseDepartureItems(row.departures),
    included: parseStringArray(row.included),
    excluded: parseStringArray(row.excluded),
    aiNotes: row.ai_notes,
  };
}

function toDbPayload(values: BrainProductFormValues) {
  return {
    name: values.name,
    category: values.category,
    destination: values.destination,
    description: values.description,
    highlights: values.highlights,
    pricing: values.pricing,
    departures: values.departures,
    included: values.included,
    excluded: values.excluded,
    ai_notes: values.aiNotes,
    status: values.status,
  };
}

export async function listBrainProducts(
  businessBrainId: string,
): Promise<BrainProductRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_products")
    .select("*")
    .eq("business_brain_id", businessBrainId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function findBrainProductById(
  productId: string,
): Promise<BrainProductRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createBrainProduct(
  businessBrainId: string,
  values: Partial<BrainProductFormValues> = {},
): Promise<BrainProductRow> {
  const supabase = await createClient();
  const payload = {
    business_brain_id: businessBrainId,
    name: values.name ?? "Untitled Product",
    category: values.category ?? "",
    destination: values.destination ?? "",
    description: values.description ?? "",
    highlights: values.highlights ?? [],
    pricing: values.pricing ?? [],
    departures: values.departures ?? [],
    included: values.included ?? [],
    excluded: values.excluded ?? [],
    ai_notes: values.aiNotes ?? "",
    status: values.status ?? "draft",
  };

  const { data, error } = await supabase
    .from("brain_products")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateBrainProduct(
  productId: string,
  values: BrainProductFormValues,
): Promise<BrainProductRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_products")
    .update(toDbPayload(values))
    .eq("id", productId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateBrainProductStatus(
  productId: string,
  status: BrainProductStatus,
): Promise<BrainProductRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_products")
    .update({ status })
    .eq("id", productId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function countProductDocumentsByProductIds(
  productIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (productIds.length === 0) return counts;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_documents")
    .select("product_id")
    .in("product_id", productIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    counts.set(row.product_id, (counts.get(row.product_id) ?? 0) + 1);
  }

  return counts;
}

export async function countProductFaqLinksByProductIds(
  productIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (productIds.length === 0) return counts;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_faq_links")
    .select("product_id")
    .in("product_id", productIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    counts.set(row.product_id, (counts.get(row.product_id) ?? 0) + 1);
  }

  return counts;
}

export function mapBrainProductRowToListItem(
  row: BrainProductRow,
  counts: { documentCount: number; faqCount: number },
): BrainProductListItem {
  return toListItem(row, counts);
}

export function mapBrainProductRowToFormValues(row: BrainProductRow) {
  return mapFormValues(row);
}

export { mapFormValues as mapBrainProductFormValues };
