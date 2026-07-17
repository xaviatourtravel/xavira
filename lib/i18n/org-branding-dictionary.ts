export type OrgBrandingUiDictionary = {
  pageTitle: string;
  pageSubtitle: string;
  logoSection: string;
  logoHint: string;
  logoFormats: string;
  uploadLogo: string;
  replaceLogo: string;
  removeLogo: string;
  uploading: string;
  saving: string;
  identitySection: string;
  displayName: string;
  legalName: string;
  tagline: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  taxId: string;
  colorsSection: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  resetColors: string;
  previewSection: string;
  previewSampleButton: string;
  saveBranding: string;
  brandingSaved: string;
  logoUploaded: string;
  logoRemoved: string;
  manageWorkspaceBranding: string;
  inheritedFromWorkspace: string;
  noLogoYet: string;
  unauthorized: string;
  settingsCardTitle: string;
  settingsCardDescription: string;
  settingsCardCta: string;
  breadcrumbSettings: string;
  breadcrumbBranding: string;
};

export type OrgBrandingUiKey = keyof OrgBrandingUiDictionary;

export const orgBrandingUiEn: OrgBrandingUiDictionary = {
  pageTitle: "Workspace branding",
  pageSubtitle:
    "Logo, company identity, and colors used across invoices and other documents.",
  logoSection: "Logo",
  logoHint: "Recommended square or landscape logo, at least 256px wide.",
  logoFormats: "PNG or JPEG · max 2 MB · SVG not supported",
  uploadLogo: "Upload logo",
  replaceLogo: "Replace logo",
  removeLogo: "Remove logo",
  uploading: "Uploading…",
  saving: "Saving…",
  identitySection: "Company identity",
  displayName: "Workspace name",
  legalName: "Legal name",
  tagline: "Tagline",
  address: "Address",
  email: "Email",
  phone: "Phone",
  website: "Website",
  taxId: "Tax ID (NPWP)",
  colorsSection: "Brand colors",
  primaryColor: "Primary",
  secondaryColor: "Secondary",
  accentColor: "Accent",
  resetColors: "Reset to defaults",
  previewSection: "Preview",
  previewSampleButton: "Sample action",
  saveBranding: "Save branding",
  brandingSaved: "Workspace branding saved.",
  logoUploaded: "Logo uploaded.",
  logoRemoved: "Logo removed.",
  manageWorkspaceBranding: "Manage workspace branding",
  inheritedFromWorkspace: "Inherited from workspace branding",
  noLogoYet: "No logo yet — initials will be used on documents.",
  unauthorized: "Only owners and admins can edit workspace branding.",
  settingsCardTitle: "Brand assets",
  settingsCardDescription:
    "Logo, company identity, and colors for invoices and other documents.",
  settingsCardCta: "Manage branding",
  breadcrumbSettings: "Settings",
  breadcrumbBranding: "Branding",
};

export const orgBrandingUiId: OrgBrandingUiDictionary = {
  pageTitle: "Branding workspace",
  pageSubtitle:
    "Logo, identitas perusahaan, dan warna yang dipakai di invoice dan dokumen lain.",
  logoSection: "Logo",
  logoHint: "Disarankan logo persegi atau landscape, minimal lebar 256px.",
  logoFormats: "PNG atau JPEG · maks 2 MB · SVG belum didukung",
  uploadLogo: "Unggah logo",
  replaceLogo: "Ganti logo",
  removeLogo: "Hapus logo",
  uploading: "Mengunggah…",
  saving: "Menyimpan…",
  identitySection: "Identitas perusahaan",
  displayName: "Nama workspace",
  legalName: "Nama legal",
  tagline: "Tagline",
  address: "Alamat",
  email: "Email",
  phone: "Telepon",
  website: "Website",
  taxId: "NPWP",
  colorsSection: "Warna merek",
  primaryColor: "Primer",
  secondaryColor: "Sekunder",
  accentColor: "Aksen",
  resetColors: "Kembalikan default",
  previewSection: "Pratinjau",
  previewSampleButton: "Contoh tombol",
  saveBranding: "Simpan branding",
  brandingSaved: "Branding workspace disimpan.",
  logoUploaded: "Logo diunggah.",
  logoRemoved: "Logo dihapus.",
  manageWorkspaceBranding: "Kelola branding workspace",
  inheritedFromWorkspace: "Mengikuti branding workspace",
  noLogoYet: "Belum ada logo — inisial akan dipakai di dokumen.",
  unauthorized: "Hanya owner dan admin yang dapat mengubah branding workspace.",
  settingsCardTitle: "Aset merek",
  settingsCardDescription:
    "Logo, identitas perusahaan, dan warna untuk invoice serta dokumen lain.",
  settingsCardCta: "Kelola branding",
  breadcrumbSettings: "Pengaturan",
  breadcrumbBranding: "Branding",
};
