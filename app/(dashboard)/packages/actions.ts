"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminOrOwner } from "@/lib/auth/permissions";
import { auditFromProfile } from "@/lib/audit";
import { buildDuplicatePackageName } from "@/lib/packages/duplicate-name";
import {
  parseOptionalDurationDays,
  parseOptionalPriceIdr,
  parseOptionalQuota,
} from "@/lib/packages/parse-numeric";
import { requireProfile } from "@/lib/auth/session";
import { encodeActionError } from "@/lib/errors";
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
    redirect(`/packages/new?error=${encodeActionError(error)}`);
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
      `/packages/${packageId}/edit?error=${encodeActionError(error)}`,
    );
  }

  if (!updatedPackage) {
    redirect("/packages?error=Paket tidak ditemukan");
  }

  revalidatePath("/packages");
  redirect("/packages");
}

export async function duplicatePackage(formData: FormData) {
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      "/packages?error=Hanya admin atau owner yang dapat menduplikasi paket.",
    );
  }

  const packageId = getString(formData, "package_id");

  if (!packageId) {
    redirect("/packages?error=Paket tidak ditemukan");
  }

  const supabase = await createClient();

  const { data: originalPackage, error: loadError } = await supabase
    .from("packages")
    .select(
      "id, name, destination, departure_date, duration_days, price_idr, quota",
    )
    .eq("id", packageId)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (loadError) {
    redirect(
      `/packages?error=${encodeActionError(loadError, "duplicatePackage")}`,
    );
  }

  if (!originalPackage) {
    redirect("/packages?error=Paket tidak ditemukan");
  }

  const { data: existingPackages, error: namesError } = await supabase
    .from("packages")
    .select("name")
    .eq("organization_id", profile.organization_id);

  if (namesError) {
    redirect(
      `/packages?error=${encodeActionError(namesError, "duplicatePackage")}`,
    );
  }

  const duplicateName = buildDuplicatePackageName(
    originalPackage.name,
    (existingPackages ?? []).map((pkg) => pkg.name),
  );

  const { data: createdPackage, error: createError } = await supabase
    .from("packages")
    .insert({
      organization_id: profile.organization_id,
      name: duplicateName,
      destination: originalPackage.destination,
      departure_date: originalPackage.departure_date,
      duration_days: originalPackage.duration_days,
      price_idr: originalPackage.price_idr,
      quota: originalPackage.quota,
      status: "draft",
    })
    .select("id, name")
    .single();

  if (createError || !createdPackage) {
    redirect(
      `/packages?error=${encodeActionError(createError ?? "Gagal menduplikasi paket", "duplicatePackage")}`,
    );
  }

  await auditFromProfile(supabase, profile, {
    action: "package_duplicated",
    entityType: "package",
    entityId: createdPackage.id,
    entityLabel: createdPackage.name,
    metadata: {
      original_package_id: packageId,
      new_package_id: createdPackage.id,
      package_name: createdPackage.name,
    },
  });

  revalidatePath("/packages");
  redirect(
    `/packages/${createdPackage.id}/edit?success=${encodeURIComponent("Package duplicated. Update the departure date before publishing.")}`,
  );
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
    redirect(`/packages?error=${encodeActionError(error)}`);
  }

  if (!deletedPackage) {
    redirect("/packages?error=Paket tidak ditemukan");
  }

  revalidatePath("/packages");
  redirect("/packages");
}
