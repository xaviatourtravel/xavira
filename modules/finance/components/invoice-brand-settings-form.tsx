"use client";

import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  finalizeInvoiceBrandLogoUploadAction,
  prepareInvoiceBrandLogoUploadAction,
  removeInvoiceBrandLogoAction,
  saveInvoiceBrandProfileAction,
} from "@/modules/finance/actions/invoice-actions";
import { PaymentAccountsEditor } from "@/modules/finance/components/payment-accounts-editor";
import {
  coercePaymentAccounts,
  invoicePaymentAccountsSchema,
  type InvoicePaymentAccount,
} from "@/modules/finance/lib/invoice-payment-accounts";
import {
  normalizeBrandInvoicePrefix,
  type InvoiceBrandProfile,
} from "@/modules/finance/lib/invoice-brand-profiles";
import {
  hashFileSha256,
  uploadWorkspaceLogoToSignedUrl,
} from "@/modules/organization/branding/lib/logo-direct-upload-client";
import { WORKSPACE_LOGO_MAX_BYTES } from "@/modules/organization/branding/types";

type InvoiceBrandSettingsFormProps = {
  profiles: InvoiceBrandProfile[];
  logoPreviewById: Record<string, string | null>;
  initialBrandKey?: string;
};

export function InvoiceBrandSettingsForm({
  profiles,
  logoPreviewById,
  initialBrandKey,
}: InvoiceBrandSettingsFormProps) {
  const { tStrict } = useTranslation();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(
    profiles.find((profile) => profile.key === initialBrandKey)?.id ??
      profiles.find((profile) => profile.isDefault)?.id ??
      profiles[0]?.id ??
      "",
  );
  const selected =
    profiles.find((profile) => profile.id === selectedId) ?? profiles[0] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold">
          {tStrict("financeUi.sectionBranding")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {tStrict("financeUi.financeBrandsHint")}
        </p>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label={tStrict("financeUi.sectionBranding")}
      >
        {profiles.map((profile) => {
          const selectedTab = profile.id === selectedId;
          return (
            <button
              key={profile.id}
              type="button"
              role="tab"
              aria-selected={selectedTab}
              onClick={() => {
                setSelectedId(profile.id);
                setMessage(null);
                setError(null);
              }}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selectedTab
                  ? "border-primary bg-primary/5 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {profile.name}
            </button>
          );
        })}
      </div>

      {selected ? (
        <BrandProfileCard
          key={selected.id}
          profile={selected}
          logoPreviewUrl={logoPreviewById[selected.id] ?? null}
          disabled={pending}
          onMessage={setMessage}
          onError={setError}
        />
      ) : null}

      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-emerald-700" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function BrandProfileCard({
  profile,
  logoPreviewUrl,
  disabled,
  onMessage,
  onError,
}: {
  profile: InvoiceBrandProfile;
  logoPreviewUrl: string | null;
  disabled: boolean;
  onMessage: (value: string | null) => void;
  onError: (value: string | null) => void;
}) {
  const { tStrict } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [accounts, setAccounts] = useState<InvoicePaymentAccount[]>(() =>
    coercePaymentAccounts(profile.paymentAccountsJson),
  );
  const [isDefault, setIsDefault] = useState(profile.isDefault);

  async function handleLogoFile(file: File | null) {
    if (!file) return;
    onError(null);
    onMessage(null);
    if (file.size > WORKSPACE_LOGO_MAX_BYTES) {
      onError(tStrict("orgBrandingUi.logoFormats"));
      return;
    }
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      onError(tStrict("orgBrandingUi.logoFormats"));
      return;
    }
    setUploading(true);
    try {
      const contentHash = await hashFileSha256(file);
      const prepared = await prepareInvoiceBrandLogoUploadAction({
        profileId: profile.id,
        originalFilename: file.name,
        declaredMimeType: file.type,
        declaredSize: file.size,
        contentHash,
      });
      if (!prepared.ok) {
        onError(prepared.message);
        return;
      }
      if (!prepared.alreadyUploaded) {
        await uploadWorkspaceLogoToSignedUrl({
          storagePath: prepared.storagePath,
          token: prepared.token,
          file,
          mimeType: prepared.mimeType,
        });
      }
      const finalized = await finalizeInvoiceBrandLogoUploadAction({
        profileId: profile.id,
        storagePath: prepared.storagePath,
        contentHash,
        mimeType: prepared.mimeType,
      });
      if (!finalized.ok) {
        onError(finalized.message);
        return;
      }
      onMessage(tStrict("financeUi.brandSaved"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      className="space-y-4 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        onMessage(null);
        onError(null);
        startTransition(async () => {
          const parsed = invoicePaymentAccountsSchema.safeParse(accounts);
          if (!parsed.success) {
            onError(
              parsed.error.issues[0]?.message ??
                tStrict("financeUi.paymentAccountsInvalid"),
            );
            return;
          }
          const result = await saveInvoiceBrandProfileAction({
            profileId: profile.id,
            displayName: String(data.get("display_name") ?? ""),
            legalName: String(data.get("legal_name") ?? "") || null,
            address: String(data.get("address") ?? "") || null,
            email: String(data.get("email") ?? "") || null,
            phone: String(data.get("phone") ?? "") || null,
            website: String(data.get("website") ?? "") || null,
            taxId: String(data.get("tax_id") ?? "") || null,
            footerText: String(data.get("footer_text") ?? "") || null,
            invoiceTitle: String(data.get("invoice_title") ?? ""),
            invoicePrefix: String(data.get("invoice_prefix") ?? ""),
            primaryColor: String(data.get("primary_color") ?? ""),
            secondaryColor: String(data.get("secondary_color") ?? ""),
            accentColor: String(data.get("accent_color") ?? ""),
            isDefault,
            paymentAccountsJson: parsed.data,
          });
          if (!result.success) {
            onError(result.message);
            return;
          }
          onMessage(tStrict("financeUi.brandSaved"));
        });
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{profile.name}</h3>
          <p className="text-xs text-muted-foreground">{profile.key}</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(event) => setIsDefault(event.target.checked)}
          />
          {tStrict("financeUi.defaultBrand")}
        </label>
      </div>

      <div className="flex items-center gap-3">
        {logoPreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoPreviewUrl}
            alt=""
            className="h-12 w-auto rounded border bg-white object-contain p-1"
          />
        ) : (
          <span className="text-sm text-muted-foreground">
            {tStrict("financeUi.brandNoLogo")}
          </span>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg"
          className="sr-only"
          onChange={(event) => {
            void handleLogoFile(event.currentTarget.files?.[0] ?? null);
            event.currentTarget.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || uploading}
          onClick={() => fileRef.current?.click()}
        >
          {tStrict("financeUi.brandLogoChange")}
        </Button>
        {profile.logoPath ? (
          <Button
            type="button"
            variant="ghost"
            disabled={disabled || uploading}
            onClick={() => {
              startTransition(async () => {
                const result = await removeInvoiceBrandLogoAction(profile.id);
                if (!result.success) {
                  onError(result.message);
                  return;
                }
                onMessage(tStrict("financeUi.brandSaved"));
              });
            }}
          >
            {tStrict("financeUi.brandLogoRemove")}
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {tStrict("financeUi.brandNumberingHint")}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Field
          id={`${profile.id}-display_name`}
          name="display_name"
          label={tStrict("financeUi.brandDisplayName")}
          defaultValue={profile.displayName}
        />
        <div className="space-y-2">
          <Label htmlFor={`${profile.id}-invoice_title`}>
            {tStrict("financeUi.invoiceTitleLabel")}
          </Label>
          <Input
            id={`${profile.id}-invoice_title`}
            name="invoice_title"
            defaultValue={profile.invoiceTitle}
            maxLength={80}
          />
          <p className="text-xs text-muted-foreground">
            {tStrict("financeUi.invoiceTitleHelper")}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${profile.id}-invoice_prefix`}>
            {tStrict("financeUi.brandInvoicePrefixLabel")}
          </Label>
          <Input
            id={`${profile.id}-invoice_prefix`}
            name="invoice_prefix"
            defaultValue={profile.invoicePrefix}
            maxLength={24}
            className="uppercase"
            onInput={(event) => {
              const target = event.currentTarget;
              target.value = target.value.toUpperCase().replace(/[^A-Z0-9/]/g, "");
            }}
          />
          <p className="text-xs text-muted-foreground">
            {tStrict("financeUi.brandInvoicePrefixHelper")}
          </p>
        </div>
        <Field
          id={`${profile.id}-legal_name`}
          name="legal_name"
          label={tStrict("financeUi.legalName")}
          defaultValue={profile.legalName ?? ""}
        />
        <Field
          id={`${profile.id}-email`}
          name="email"
          label={tStrict("financeUi.companyEmail")}
          defaultValue={profile.email ?? ""}
        />
        <Field
          id={`${profile.id}-phone`}
          name="phone"
          label={tStrict("financeUi.companyPhone")}
          defaultValue={profile.phone ?? ""}
        />
        <Field
          id={`${profile.id}-website`}
          name="website"
          label={tStrict("financeUi.companyWebsite")}
          defaultValue={profile.website ?? ""}
        />
        <Field
          id={`${profile.id}-tax_id`}
          name="tax_id"
          label={tStrict("financeUi.taxId")}
          defaultValue={profile.taxId ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${profile.id}-address`}>
          {tStrict("financeUi.companyAddress")}
        </Label>
        <textarea
          id={`${profile.id}-address`}
          name="address"
          rows={2}
          defaultValue={profile.address ?? ""}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${profile.id}-footer_text`}>
          {tStrict("financeUi.footerText")}
        </Label>
        <textarea
          id={`${profile.id}-footer_text`}
          name="footer_text"
          rows={2}
          defaultValue={profile.footerText ?? ""}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <ColorField
          id={`${profile.id}-primary_color`}
          name="primary_color"
          label={tStrict("financeUi.primaryColor")}
          defaultValue={profile.primaryColor}
        />
        <ColorField
          id={`${profile.id}-secondary_color`}
          name="secondary_color"
          label={tStrict("financeUi.secondaryColor")}
          defaultValue={profile.secondaryColor}
        />
        <ColorField
          id={`${profile.id}-accent_color`}
          name="accent_color"
          label={tStrict("financeUi.accentColor")}
          defaultValue={profile.accentColor}
        />
      </div>
      <PaymentAccountsEditor
        value={accounts}
        onChange={setAccounts}
        disabled={disabled || pending}
      />
      <Button type="submit" disabled={disabled || pending}>
        {tStrict("financeUi.saveFinanceBrand")}
      </Button>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} defaultValue={defaultValue} />
    </div>
  );
}

function ColorField({
  id,
  name,
  label,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#0F172A"}
          onChange={(event) => setValue(event.target.value.toUpperCase())}
          aria-label={label}
          className="h-10 w-10 cursor-pointer rounded border bg-transparent p-1"
        />
        <Input
          id={id}
          name={name}
          value={value}
          maxLength={7}
          className="uppercase"
          onChange={(event) => setValue(event.target.value.toUpperCase())}
        />
      </div>
    </div>
  );
}
