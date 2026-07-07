import { createClient } from "@/utils/supabase/server";

import { logProductUploadError, logProductUploadStep } from "@/modules/business-brain/lib/product-upload-debug";
import type {
  ProductDocumentRecord,
  ProductDocumentType,
} from "@/modules/business-brain/types/products";

export type ProductDocumentRow = {
  id: string;
  product_id: string;
  document_type: string;
  file_name: string | null;
  file_path: string | null;
  file_url: string | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
};

function mapDocumentRow(row: ProductDocumentRow): ProductDocumentRecord {
  return {
    id: row.id,
    productId: row.product_id,
    documentType: row.document_type as ProductDocumentType,
    fileName: row.file_name,
    filePath: row.file_path,
    fileUrl: row.file_url,
    mimeType: row.mime_type,
    createdAt: row.created_at,
  };
}

export async function listProductDocuments(
  productId: string,
): Promise<ProductDocumentRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_documents")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapDocumentRow);
}

export async function insertProductDocument(input: {
  productId: string;
  documentType: ProductDocumentType;
  fileName?: string | null;
  filePath?: string | null;
  fileUrl?: string | null;
  mimeType?: string | null;
}): Promise<ProductDocumentRecord> {
  const supabase = await createClient();
  const row = {
    product_id: input.productId,
    document_type: input.documentType,
    file_name: input.fileName ?? null,
    file_path: input.filePath ?? null,
    file_url: input.fileUrl ?? null,
    mime_type: input.mimeType ?? null,
  };

  logProductUploadStep("Database insert request", row);

  const { data, error } = await supabase
    .from("product_documents")
    .insert(row)
    .select("*")
    .single();

  logProductUploadStep("Database response", {
    data,
    error: error
      ? {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        }
      : null,
  });

  if (error) {
    logProductUploadError(error);
    throw error;
  }

  return mapDocumentRow(data);
}

export async function deleteProductDocument(documentId: string): Promise<ProductDocumentRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_documents")
    .delete()
    .eq("id", documentId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function findProductDocumentById(
  documentId: string,
): Promise<ProductDocumentRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function listProductIdsWithItinerary(
  productIds: string[],
): Promise<Set<string>> {
  if (productIds.length === 0) {
    return new Set();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_documents")
    .select("product_id")
    .in("product_id", productIds)
    .eq("document_type", "itinerary");

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => row.product_id));
}
