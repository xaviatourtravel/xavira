"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import {
  parseOptionalDurationDays,
  parseOptionalPriceIdr,
  parseOptionalQuota,
} from "@/lib/packages/parse-numeric";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";
import type { Database, TablesInsert } from "@/types/database";

type PackageInsert = TablesInsert<"packages">;
type PackageStatus = Database["public"]["Enums"]["package_status"];

const PACKAGE_STATUSES: PackageStatus[] = [
  "draft",
  "active",
  "inactive",
  "sold_out",
];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getPackageNumericFields(formData: FormData) {
  return {
    duration_days: parseOptionalDurationDays(
      getString(formData, "duration_days"),
    ),
    price_idr: parseOptionalPriceIdr(getString(formData, "price_idr")),
    quota: parseOptionalQuota(getString(formData, "quota")),
  };
}

function parsePackageStatus(value: string): PackageStatus {
  if (PACKAGE_STATUSES.includes(value as PackageStatus)) {
    return value as PackageStatus;
  }

  return "draft";
}

function buildPackagePayload(
  formData: FormData,
  organizationId: string,
): PackageInsert | null {
  const name = getString(formData, "name");

  if (!name) {
    return null;
  }

  const numericFields = getPackageNumericFields(formData);

  return {
    organization_id: organizationId,
    name,
    destination: getString(formData, "destination") || null,
    departure_date: getString(formData, "departure_date") || null,
    duration_days: numericFields.duration_days,
    price_idr: numericFields.price_idr,
    quota: numericFields.quota,
    status: parsePackageStatus(getString(formData, "status")),
  };
}

export async function createPackage(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      "/packages?error=Hanya admin atau owner yang dapat menambah paket.",
    );
  }

  const payload = buildPackagePayload(formData, profile.organization_id);

  if (!payload) {
    redirect("/packages/new?error=Nama paket wajib diisi");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("packages").insert(payload);

  if (error) {
    redirect(`/packages/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/packages");
  redirect("/packages");
}

export async function updatePackage(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect("/packages?error=Hanya admin atau owner yang dapat mengubah paket.");
  }

  const packageId = getString(formData, "package_id");
  const name = getString(formData, "name");
  const destination = getString(formData, "destination");
  const departureDate = getString(formData, "departure_date");
  const numericFields = getPackageNumericFields(formData);
  const status = parsePackageStatus(getString(formData, "status"));

  if (!packageId) {
    redirect("/packages?error=Paket tidak ditemukan");
  }

  if (!name) {
    redirect(`/packages/${packageId}/edit?error=Nama paket wajib diisi`);
  }

  const supabase = await createClient();
  const { data: updatedPackage, error } = await supabase
    .from("packages")
    .update({
      name,
      destination: destination || null,
      departure_date: departureDate || null,
      duration_days: numericFields.duration_days,
      price_idr: numericFields.price_idr,
      quota: numericFields.quota,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", packageId)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(
      `/packages/${packageId}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  if (!updatedPackage) {
    redirect("/packages?error=Paket tidak ditemukan");
  }

  revalidatePath("/packages");
  redirect("/packages");
}

export async function deletePackage(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      "/packages?error=Hanya admin atau owner yang dapat menghapus paket.",
    );
  }

  const packageId = getString(formData, "package_id");

  if (!packageId) {
    redirect("/packages?error=Paket tidak ditemukan");
  }

  const supabase = await createClient();
  const { data: deletedPackage, error } = await supabase
    .from("packages")
    .delete()
    .eq("id", packageId)
    .eq("organization_id", profile.organization_id)
    .select("id")
    .maybeSingle();

  if (error) {
    redirect(`/packages?error=${encodeURIComponent(error.message)}`);
  }

  if (!deletedPackage) {
    redirect("/packages?error=Paket tidak ditemukan");
  }

  revalidatePath("/packages");
  redirect("/packages");
}
