import type { Json } from "@/types/database";
import type { Profile } from "@/types/app-types";

import {
  assertInvoicePermission,
  requireOrganizationId,
} from "@/modules/finance/lib/invoice-access";
import {
  assertUniqueActiveBrandPrefix,
  companySnapshotFromBrand,
  freezeInvoiceBrandSnapshot,
  summarizeBrandPaymentAccounts,
  themeSnapshotFromBrand,
  type InvoiceBrandEditorOption,
  type InvoiceBrandProfile,
  type InvoiceBrandSnapshot,
} from "@/modules/finance/lib/invoice-brand-profiles";
import type {
  InvoiceCompanySnapshot,
  InvoiceThemeSnapshot,
} from "@/modules/finance/types/invoices";
import * as invoiceRepo from "@/modules/finance/repositories/invoice-repository";
import * as brandRepo from "@/modules/finance/repositories/invoice-brand-profile-repository";
import { parseOrganizationWorkspaceSettings } from "@/lib/settings/organization-settings";
import {
  createWorkspaceLogoPreviewUrl,
  createWorkspaceLogoSignedUploadUrl,
  plannedLogoPath,
  removeWorkspaceLogoObject,
} from "@/modules/organization/branding/lib/logo-storage";
import {
  buildWorkspaceLogoStorageRef,
  validateWorkspaceLogoPrepareMetadata,
} from "@/modules/organization/branding/lib/logo-validation";
import type { WorkspaceLogoMime } from "@/modules/organization/branding/types";

export async function ensureOrganizationInvoiceBrandProfiles(
  organizationId: string,
): Promise<InvoiceBrandProfile[]> {
  let profiles = await brandRepo.listInvoiceBrandProfiles(organizationId);
  if (profiles.length === 0) {
    const org = await invoiceRepo.getOrganizationSlug(organizationId);
    const settings = parseOrganizationWorkspaceSettings(org.settings);
    await invoiceRepo.ensureBrandSettingsDefaults({
      organizationId,
      legalName: org.name,
      email: settings.businessEmail || null,
      phone: org.phone,
      website: settings.website || null,
      logoUrl: settings.logoUrl,
    });
    await brandRepo.seedInvoiceBrandProfilesForOrg(organizationId);
    profiles = await brandRepo.listInvoiceBrandProfiles(organizationId);
  }
  return profiles;
}

export async function resolveDocumentBrand(
  organizationId: string,
  brandProfileId?: string | null,
): Promise<{
  profile: InvoiceBrandProfile;
  companySnapshot: InvoiceCompanySnapshot;
  themeSnapshot: InvoiceThemeSnapshot;
  brandSnapshot: InvoiceBrandSnapshot;
}> {
  const profiles = await ensureOrganizationInvoiceBrandProfiles(organizationId);
  const selected =
    (brandProfileId
      ? profiles.find((profile) => profile.id === brandProfileId)
      : null) ??
    profiles.find((profile) => profile.isDefault) ??
    profiles[0];

  if (!selected) {
    throw new Error("No finance brand is configured for this workspace");
  }

  const brandSnapshot = freezeInvoiceBrandSnapshot(selected);
  return {
    profile: selected,
    companySnapshot: companySnapshotFromBrand(brandSnapshot),
    themeSnapshot: themeSnapshotFromBrand(brandSnapshot),
    brandSnapshot,
  };
}

export async function listInvoiceBrandEditorOptions(
  organizationId: string,
): Promise<InvoiceBrandEditorOption[]> {
  const profiles = await ensureOrganizationInvoiceBrandProfiles(organizationId);
  const options: InvoiceBrandEditorOption[] = [];
  for (const profile of profiles) {
    let logoPreviewUrl: string | null = null;
    if (profile.logoPath) {
      logoPreviewUrl = await createWorkspaceLogoPreviewUrl(
        profile.logoPath,
        organizationId,
      );
    }
    options.push({
      id: profile.id,
      key: profile.key,
      name: profile.name,
      displayName: profile.displayName,
      legalName: profile.legalName,
      logoPreviewUrl,
      address: profile.address,
      email: profile.email,
      phone: profile.phone,
      taxId: profile.taxId,
      bankSummary: summarizeBrandPaymentAccounts(profile.paymentAccountsJson),
      isDefault: profile.isDefault,
      isActive: profile.isActive,
    });
  }
  return options;
}

export async function getOrganizationFinanceBrands(profile: Profile): Promise<{
  profiles: InvoiceBrandProfile[];
  editorOptions: InvoiceBrandEditorOption[];
  invoicePrefix: string | null;
}> {
  assertInvoicePermission(profile, "invoices.view");
  const organizationId = requireOrganizationId(profile);
  const org = await invoiceRepo.getOrganizationSlug(organizationId);
  const settings = parseOrganizationWorkspaceSettings(org.settings);
  const brand = await invoiceRepo.ensureBrandSettingsDefaults({
    organizationId,
    legalName: org.name,
    email: settings.businessEmail || null,
    phone: org.phone,
    website: settings.website || null,
    logoUrl: settings.logoUrl,
  });
  const profiles = await ensureOrganizationInvoiceBrandProfiles(organizationId);
  const editorOptions = await listInvoiceBrandEditorOptions(organizationId);
  return {
    profiles,
    editorOptions,
    invoicePrefix: brand.invoicePrefix,
  };
}

export async function saveInvoiceBrandProfile(
  profile: Profile,
  input: {
    profileId: string;
    displayName: string;
    legalName: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    taxId: string | null;
    footerText: string | null;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    invoicePrefix: string;
    invoiceTitle: string;
    paymentAccountsJson: unknown;
    isDefault?: boolean;
  },
): Promise<InvoiceBrandProfile> {
  assertInvoicePermission(profile, "invoices.edit");
  const organizationId = requireOrganizationId(profile);
  const existing = await brandRepo.getInvoiceBrandProfile(
    organizationId,
    input.profileId,
  );
  if (!existing) {
    throw new Error("Finance brand not found");
  }

  const profiles = await brandRepo.listInvoiceBrandProfiles(organizationId);
  assertUniqueActiveBrandPrefix({
    profiles,
    profileId: input.profileId,
    invoicePrefix: input.invoicePrefix,
  });

  return brandRepo.updateInvoiceBrandProfile({
    organizationId,
    profileId: input.profileId,
    patch: {
      displayName: input.displayName,
      legalName: input.legalName,
      address: input.address,
      email: input.email,
      phone: input.phone,
      website: input.website,
      taxId: input.taxId,
      footerText: input.footerText,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      accentColor: input.accentColor,
      invoicePrefix: input.invoicePrefix,
      invoiceTitle: input.invoiceTitle,
      paymentAccountsJson: input.paymentAccountsJson as Json,
      isDefault: input.isDefault,
    },
  });
}

export async function prepareInvoiceBrandLogoUpload(
  profile: Profile,
  input: {
    profileId: string;
    originalFilename: string;
    declaredMimeType: string;
    declaredSize: number;
    contentHash: string;
  },
): Promise<{
  storagePath: string;
  token: string;
  signedUrl: string;
  alreadyUploaded: boolean;
  mimeType: WorkspaceLogoMime;
}> {
  assertInvoicePermission(profile, "invoices.edit");
  const organizationId = requireOrganizationId(profile);
  const existing = await brandRepo.getInvoiceBrandProfile(
    organizationId,
    input.profileId,
  );
  if (!existing) {
    throw new Error("Finance brand not found");
  }

  const validated = validateWorkspaceLogoPrepareMetadata({
    originalFilename: input.originalFilename,
    declaredMimeType: input.declaredMimeType,
    declaredSize: input.declaredSize,
  });
  if (!validated.ok) {
    throw new Error(`${validated.code}: ${validated.message}`);
  }

  const storagePath = plannedLogoPath({
    organizationId,
    contentHash: input.contentHash,
    mimeType: validated.mimeType,
  });

  if (existing.logoPath === storagePath && existing.logoContentHash === input.contentHash) {
    return {
      storagePath,
      token: "",
      signedUrl: "",
      alreadyUploaded: true,
      mimeType: validated.mimeType,
    };
  }

  const uploaded = await createWorkspaceLogoSignedUploadUrl(
    storagePath,
    organizationId,
  );
  return {
    storagePath,
    token: uploaded.token,
    signedUrl: uploaded.signedUrl,
    alreadyUploaded: false,
    mimeType: validated.mimeType,
  };
}

export async function finalizeInvoiceBrandLogoUpload(
  profile: Profile,
  input: {
    profileId: string;
    storagePath: string;
    contentHash: string;
    mimeType: WorkspaceLogoMime;
  },
): Promise<InvoiceBrandProfile> {
  assertInvoicePermission(profile, "invoices.edit");
  const organizationId = requireOrganizationId(profile);
  const existing = await brandRepo.getInvoiceBrandProfile(
    organizationId,
    input.profileId,
  );
  if (!existing) {
    throw new Error("Finance brand not found");
  }

  const previousPath = existing.logoPath;
  const saved = await brandRepo.updateInvoiceBrandProfile({
    organizationId,
    profileId: input.profileId,
    patch: {
      logoPath: input.storagePath,
      logoContentHash: input.contentHash,
      logoStorageRef: buildWorkspaceLogoStorageRef(input.storagePath),
    },
  });

  if (previousPath && previousPath !== input.storagePath) {
    try {
      await removeWorkspaceLogoObject(previousPath, organizationId);
    } catch {
      // Keep the new logo even if the previous object cannot be removed.
    }
  }

  return saved;
}

export async function removeInvoiceBrandLogo(
  profile: Profile,
  profileId: string,
): Promise<InvoiceBrandProfile> {
  assertInvoicePermission(profile, "invoices.edit");
  const organizationId = requireOrganizationId(profile);
  const existing = await brandRepo.getInvoiceBrandProfile(
    organizationId,
    profileId,
  );
  if (!existing) {
    throw new Error("Finance brand not found");
  }

  const saved = await brandRepo.updateInvoiceBrandProfile({
    organizationId,
    profileId,
    patch: {
      logoPath: null,
      logoContentHash: null,
      logoStorageRef: null,
    },
  });

  if (existing.logoPath) {
    try {
      await removeWorkspaceLogoObject(existing.logoPath, organizationId);
    } catch {
      // Identity fields already cleared.
    }
  }

  return saved;
}
