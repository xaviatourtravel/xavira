import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

import type {
  BrainDocumentStatus,
  BrainDocumentTrigger,
  BrainDocumentType,
} from "@/modules/business-brain/types/documents";

export type BrainDocumentRow = {
  id: string;
  business_brain_id: string;
  name: string;
  description: string;
  storage_path: string | null;
  public_url: string | null;
  mime_type: string | null;
  file_size: number | null;
  document_type: string;
  tags: Json;
  auto_send_enabled: boolean;
  ai_notes: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function parseTags(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function coerceDocumentType(value: string): BrainDocumentType {
  if (value === "image" || value === "video" || value === "url") return value;
  return "pdf";
}

function coerceStatus(value: string): BrainDocumentStatus {
  return value === "published" ? "published" : "draft";
}

export function mapBrainDocumentListFields(row: BrainDocumentRow) {
  return {
    id: row.id,
    name: row.name || "Untitled Document",
    documentType: coerceDocumentType(row.document_type),
    status: coerceStatus(row.status),
    autoSendEnabled: row.auto_send_enabled,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    tags: parseTags(row.tags),
    description: row.description,
    aiNotes: row.ai_notes,
  };
}

export async function listBrainDocuments(
  businessBrainId: string,
): Promise<BrainDocumentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_documents")
    .select("*")
    .eq("business_brain_id", businessBrainId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function findBrainDocumentById(
  documentId: string,
): Promise<BrainDocumentRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function insertBrainDocument(input: {
  businessBrainId: string;
  name: string;
  description?: string;
  storagePath?: string | null;
  publicUrl?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  documentType: BrainDocumentType;
  tags?: string[];
}): Promise<BrainDocumentRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_documents")
    .insert({
      business_brain_id: input.businessBrainId,
      name: input.name,
      description: input.description ?? "",
      storage_path: input.storagePath ?? null,
      public_url: input.publicUrl ?? null,
      mime_type: input.mimeType ?? null,
      file_size: input.fileSize ?? null,
      document_type: input.documentType,
      tags: input.tags ?? [],
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateBrainDocument(
  documentId: string,
  values: {
    name: string;
    description: string;
    documentType: BrainDocumentType;
    tags: string[];
    autoSendEnabled: boolean;
    aiNotes: string;
    status: BrainDocumentStatus;
  },
): Promise<BrainDocumentRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_documents")
    .update({
      name: values.name,
      description: values.description,
      document_type: values.documentType,
      tags: values.tags,
      auto_send_enabled: values.autoSendEnabled,
      ai_notes: values.aiNotes,
      status: values.status,
    })
    .eq("id", documentId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateBrainDocumentStatus(
  documentId: string,
  status: BrainDocumentStatus,
): Promise<BrainDocumentRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_documents")
    .update({ status })
    .eq("id", documentId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteBrainDocument(documentId: string): Promise<BrainDocumentRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_documents")
    .delete()
    .eq("id", documentId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function countDocumentProductsByDocumentIds(
  documentIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (documentIds.length === 0) return counts;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_document_products")
    .select("document_id")
    .in("document_id", documentIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    counts.set(row.document_id, (counts.get(row.document_id) ?? 0) + 1);
  }

  return counts;
}

export async function listDocumentTriggers(
  documentId: string,
): Promise<BrainDocumentTrigger[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_document_triggers")
    .select("trigger_key")
    .eq("document_id", documentId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => row.trigger_key)
    .filter((value): value is BrainDocumentTrigger =>
      [
        "customer_asks_itinerary",
        "customer_asks_brochure",
        "customer_asks_package_details",
        "customer_asks_visa",
        "customer_asks_payment",
        "customer_asks_company_profile",
      ].includes(value),
    );
}

export async function listDocumentTriggersByDocumentIds(
  documentIds: string[],
): Promise<Map<string, BrainDocumentTrigger[]>> {
  const result = new Map<string, BrainDocumentTrigger[]>();
  if (documentIds.length === 0) {
    return result;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_document_triggers")
    .select("document_id, trigger_key")
    .in("document_id", documentIds);

  if (error) {
    throw new Error(error.message);
  }

  const validTriggers = new Set<BrainDocumentTrigger>([
    "customer_asks_itinerary",
    "customer_asks_brochure",
    "customer_asks_package_details",
    "customer_asks_visa",
    "customer_asks_payment",
    "customer_asks_company_profile",
  ]);

  for (const row of data ?? []) {
    if (!validTriggers.has(row.trigger_key as BrainDocumentTrigger)) {
      continue;
    }

    const current = result.get(row.document_id) ?? [];
    current.push(row.trigger_key as BrainDocumentTrigger);
    result.set(row.document_id, current);
  }

  return result;
}

export async function replaceDocumentTriggers(
  documentId: string,
  triggers: BrainDocumentTrigger[],
): Promise<void> {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("brain_document_triggers")
    .delete()
    .eq("document_id", documentId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (triggers.length === 0) return;

  const { error: insertError } = await supabase.from("brain_document_triggers").insert(
    triggers.map((trigger) => ({
      document_id: documentId,
      trigger_key: trigger,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}
