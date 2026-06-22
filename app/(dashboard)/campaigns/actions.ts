"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseCampaignStatus } from "@/lib/campaigns/constants";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { parseLeadSourceForSave } from "@/lib/leads/source-tracking";
import { encodeActionError } from "@/lib/errors";
import { createClient } from "@/utils/supabase/server";
import type { TablesInsert } from "@/types/database";

type CampaignInsert = TablesInsert<"campaigns">;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalNumber(formData: FormData, key: string): number {
  const value = getString(formData, key);
  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildCampaignPayload(
  formData: FormData,
  organizationId: string,
  createdBy: string,
): CampaignInsert | null {
  const name = getString(formData, "name");

  if (!name) {
    return null;
  }

  return {
    organization_id: organizationId,
    created_by: createdBy,
    name,
    source: parseLeadSourceForSave(getString(formData, "source")),
    status: parseCampaignStatus(getString(formData, "status") || "active"),
    start_date: getString(formData, "start_date") || null,
    end_date: getString(formData, "end_date") || null,
    budget: getOptionalNumber(formData, "budget"),
    notes: getString(formData, "notes") || null,
    campaign_type: "custom",
    target_interest: "both",
  };
}

export async function createCampaign(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      "/campaigns?error=Hanya admin atau owner yang dapat menambah campaign.",
    );
  }

  const payload = buildCampaignPayload(
    formData,
    profile.organization_id,
    profile.id,
  );

  if (!payload) {
    redirect("/campaigns/new?error=Nama campaign wajib diisi");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").insert(payload);

  if (error) {
    redirect(`/campaigns/new?error=${encodeActionError(error)}`);
  }

  revalidatePath("/campaigns");
  redirect("/campaigns");
}

export async function updateCampaign(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      "/campaigns?error=Hanya admin atau owner yang dapat mengubah campaign.",
    );
  }

  const campaignId = getString(formData, "campaign_id");
  const name = getString(formData, "name");

  if (!campaignId) {
    redirect("/campaigns?error=Campaign tidak ditemukan");
  }

  if (!name) {
    redirect(
      `/campaigns/${campaignId}/edit?error=${encodeURIComponent("Nama campaign wajib diisi")}`,
    );
  }

  const supabase = await createClient();
  const { data: updatedCampaign, error } = await supabase
    .from("campaigns")
    .update({
      name,
      source: parseLeadSourceForSave(getString(formData, "source")),
      status: parseCampaignStatus(getString(formData, "status") || "active"),
      start_date: getString(formData, "start_date") || null,
      end_date: getString(formData, "end_date") || null,
      budget: getOptionalNumber(formData, "budget"),
      notes: getString(formData, "notes") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(
      `/campaigns/${campaignId}/edit?error=${encodeActionError(error)}`,
    );
  }

  if (!updatedCampaign) {
    redirect("/campaigns?error=Campaign tidak ditemukan");
  }

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  redirect(`/campaigns/${campaignId}`);
}

export async function deleteCampaign(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      "/campaigns?error=Hanya admin atau owner yang dapat menghapus campaign.",
    );
  }

  const campaignId = getString(formData, "campaign_id");

  if (!campaignId) {
    redirect("/campaigns?error=Campaign tidak ditemukan");
  }

  const supabase = await createClient();
  const { data: deletedCampaign, error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", campaignId)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(`/campaigns?error=${encodeActionError(error)}`);
  }

  if (!deletedCampaign) {
    redirect("/campaigns?error=Campaign tidak ditemukan");
  }

  revalidatePath("/campaigns");
  redirect("/campaigns");
}
