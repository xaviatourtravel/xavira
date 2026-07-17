"use client";

import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  finalizeWorkspaceLogoUploadAction,
  prepareWorkspaceLogoUploadAction,
  removeWorkspaceLogoAction,
  updateWorkspaceBrandingAction,
} from "@/modules/organization/branding/actions/branding-actions";
import {
  hashFileSha256,
  uploadWorkspaceLogoToSignedUrl,
} from "@/modules/organization/branding/lib/logo-direct-upload-client";
import { companyInitialsForPdf } from "@/modules/finance/pdf/invoice-pdf-labels";
import type { WorkspaceBranding } from "@/modules/organization/branding/types";
import { WORKSPACE_LOGO_MAX_BYTES } from "@/modules/organization/branding/types";

type WorkspaceBrandingFormProps = {
  initial: WorkspaceBranding;
  canManage: boolean;
};

const DEFAULT_COLORS = {
  primaryColor: "#0F172A",
  secondaryColor: "#64748B",
  accentColor: "#0EA5E9",
};

export function WorkspaceBrandingForm({
  initial,
  canManage,
}: WorkspaceBrandingFormProps) {
  const { tStrict } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [branding, setBranding] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initials = companyInitialsForPdf(
    branding.legalName || branding.displayName,
  );

  async function handleLogoFile(file: File | null) {
    if (!file || !canManage) return;
    setError(null);
    setMessage(null);
    setUploading(true);
    try {
      if (file.size > WORKSPACE_LOGO_MAX_BYTES) {
        setError(tStrict("orgBrandingUi.logoFormats"));
        return;
      }
      if (file.type !== "image/png" && file.type !== "image/jpeg") {
        setError(tStrict("orgBrandingUi.logoFormats"));
        return;
      }

      const contentHash = await hashFileSha256(file);
      const prepared = await prepareWorkspaceLogoUploadAction({
        originalFilename: file.name,
        declaredMimeType: file.type,
        declaredSize: file.size,
        contentHash,
      });
      if (!prepared.ok) {
        setError(prepared.message);
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

      const finalized = await finalizeWorkspaceLogoUploadAction({
        storagePath: prepared.storagePath,
        originalFilename: file.name,
        contentHash,
        mimeType: prepared.mimeType,
      });
      if (!finalized.ok) {
        setError(finalized.message);
        return;
      }
      setBranding(finalized.branding);
      setMessage(tStrict("orgBrandingUi.logoUploaded"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {tStrict("orgBrandingUi.pageTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tStrict("orgBrandingUi.pageSubtitle")}
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
            {tStrict("orgBrandingUi.logoSection")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {tStrict("orgBrandingUi.logoHint")}
          </p>
          <p className="text-xs text-muted-foreground">
            {tStrict("orgBrandingUi.logoFormats")}
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border bg-muted/10 p-4 sm:flex-row sm:items-center">
          <div
            className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border bg-[length:12px_12px] bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%,transparent_75%,#e2e8f0_75%),linear-gradient(45deg,#e2e8f0_25%,#fff_25%,#fff_75%,#e2e8f0_75%)] bg-[position:0_0,6px_6px]"
            aria-hidden
          >
            {branding.logoPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logoPreviewUrl}
                alt=""
                className="max-h-full max-w-full object-contain p-2"
              />
            ) : (
              <span className="text-lg font-semibold text-slate-700">
                {initials}
              </span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium">
              {branding.logoPath
                ? branding.logoPath.split("/").pop()
                : tStrict("orgBrandingUi.noLogoYet")}
            </p>
            {canManage ? (
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={(event) => {
                    void handleLogoFile(event.target.files?.[0] ?? null);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading || pending}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading
                    ? tStrict("orgBrandingUi.uploading")
                    : branding.logoPath
                      ? tStrict("orgBrandingUi.replaceLogo")
                      : tStrict("orgBrandingUi.uploadLogo")}
                </Button>
                {branding.logoPath ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={uploading || pending}
                    onClick={() => {
                      setError(null);
                      startTransition(async () => {
                        const result = await removeWorkspaceLogoAction();
                        if (!result.success) {
                          setError(result.message ?? "Failed");
                          return;
                        }
                        setBranding(result.branding);
                        setMessage(tStrict("orgBrandingUi.logoRemoved"));
                      });
                    }}
                  >
                    {tStrict("orgBrandingUi.removeLogo")}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canManage) return;
          const form = new FormData(event.currentTarget);
          setError(null);
          setMessage(null);
          startTransition(async () => {
            const result = await updateWorkspaceBrandingAction({
              displayName: String(form.get("displayName") ?? ""),
              legalName: String(form.get("legalName") ?? "") || null,
              tagline: String(form.get("tagline") ?? "") || null,
              address: String(form.get("address") ?? "") || null,
              email: String(form.get("email") ?? "") || null,
              phone: String(form.get("phone") ?? "") || null,
              website: String(form.get("website") ?? "") || null,
              taxId: String(form.get("taxId") ?? "") || null,
              primaryColor: String(form.get("primaryColor") ?? ""),
              secondaryColor: String(form.get("secondaryColor") ?? ""),
              accentColor: String(form.get("accentColor") ?? ""),
            });
            if (!result.success) {
              setError(result.message ?? "Failed");
              return;
            }
            setBranding(result.branding);
            setMessage(tStrict("orgBrandingUi.brandingSaved"));
          });
        }}
      >
        <section className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
            {tStrict("orgBrandingUi.identitySection")}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              id="displayName"
              name="displayName"
              label={tStrict("orgBrandingUi.displayName")}
              defaultValue={branding.displayName}
              disabled={!canManage}
              required
            />
            <Field
              id="legalName"
              name="legalName"
              label={tStrict("orgBrandingUi.legalName")}
              defaultValue={branding.legalName ?? ""}
              disabled={!canManage}
            />
            <Field
              id="tagline"
              name="tagline"
              label={tStrict("orgBrandingUi.tagline")}
              defaultValue={branding.tagline ?? ""}
              disabled={!canManage}
            />
            <Field
              id="taxId"
              name="taxId"
              label={tStrict("orgBrandingUi.taxId")}
              defaultValue={branding.taxId ?? ""}
              disabled={!canManage}
            />
            <Field
              id="email"
              name="email"
              label={tStrict("orgBrandingUi.email")}
              defaultValue={branding.email ?? ""}
              disabled={!canManage}
            />
            <Field
              id="phone"
              name="phone"
              label={tStrict("orgBrandingUi.phone")}
              defaultValue={branding.phone ?? ""}
              disabled={!canManage}
            />
            <Field
              id="website"
              name="website"
              label={tStrict("orgBrandingUi.website")}
              defaultValue={branding.website ?? ""}
              disabled={!canManage}
            />
            <div className="md:col-span-2">
              <Field
                id="address"
                name="address"
                label={tStrict("orgBrandingUi.address")}
                defaultValue={branding.address ?? ""}
                disabled={!canManage}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
              {tStrict("orgBrandingUi.colorsSection")}
            </h2>
            {canManage ? (
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => {
                  const primary = document.getElementById(
                    "primaryColor",
                  ) as HTMLInputElement | null;
                  const secondary = document.getElementById(
                    "secondaryColor",
                  ) as HTMLInputElement | null;
                  const accent = document.getElementById(
                    "accentColor",
                  ) as HTMLInputElement | null;
                  if (primary) primary.value = DEFAULT_COLORS.primaryColor;
                  if (secondary) secondary.value = DEFAULT_COLORS.secondaryColor;
                  if (accent) accent.value = DEFAULT_COLORS.accentColor;
                  setBranding((prev) => ({ ...prev, ...DEFAULT_COLORS }));
                }}
              >
                {tStrict("orgBrandingUi.resetColors")}
              </button>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <ColorField
              id="primaryColor"
              label={tStrict("orgBrandingUi.primaryColor")}
              defaultValue={branding.primaryColor}
              disabled={!canManage}
              onLiveChange={(value) =>
                setBranding((prev) => ({ ...prev, primaryColor: value }))
              }
            />
            <ColorField
              id="secondaryColor"
              label={tStrict("orgBrandingUi.secondaryColor")}
              defaultValue={branding.secondaryColor}
              disabled={!canManage}
              onLiveChange={(value) =>
                setBranding((prev) => ({ ...prev, secondaryColor: value }))
              }
            />
            <ColorField
              id="accentColor"
              label={tStrict("orgBrandingUi.accentColor")}
              defaultValue={branding.accentColor}
              disabled={!canManage}
              onLiveChange={(value) =>
                setBranding((prev) => ({ ...prev, accentColor: value }))
              }
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
            {tStrict("orgBrandingUi.previewSection")}
          </h2>
          <div
            className="overflow-hidden rounded-xl border"
            style={{ borderColor: branding.secondaryColor }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ backgroundColor: branding.primaryColor, color: "#fff" }}
            >
              {branding.logoPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={branding.logoPreviewUrl}
                  alt=""
                  className="h-8 w-auto max-w-[96px] object-contain"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded bg-white/20 text-xs font-bold">
                  {initials}
                </span>
              )}
              <div>
                <p className="text-sm font-semibold">
                  {branding.legalName || branding.displayName}
                </p>
                {branding.tagline ? (
                  <p className="text-xs opacity-90">{branding.tagline}</p>
                ) : null}
              </div>
            </div>
            <div className="bg-background p-4">
              <button
                type="button"
                className="rounded-md px-3 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: branding.accentColor }}
              >
                {tStrict("orgBrandingUi.previewSampleButton")}
              </button>
            </div>
          </div>
        </section>

        {message ? (
          <p className="text-sm text-emerald-700" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
        {!canManage ? (
          <p className="text-sm text-muted-foreground">
            {tStrict("orgBrandingUi.unauthorized")}
          </p>
        ) : null}

        {canManage ? (
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || uploading}>
              {pending
                ? tStrict("orgBrandingUi.saving")
                : tStrict("orgBrandingUi.saveBranding")}
            </Button>
          </div>
        ) : null}
      </form>
    </div>
  );
}

function Field(props: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        name={props.name}
        defaultValue={props.defaultValue}
        disabled={props.disabled}
        required={props.required}
      />
    </div>
  );
}

function ColorField(props: {
  id: string;
  label: string;
  defaultValue: string;
  disabled?: boolean;
  onLiveChange: (value: string) => void;
}) {
  const value = /^#[0-9A-Fa-f]{6}$/.test(props.defaultValue)
    ? props.defaultValue
    : "#0F172A";
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          disabled={props.disabled}
          aria-label={props.label}
          className="h-10 w-10 cursor-pointer rounded border bg-transparent p-1"
          onChange={(event) => {
            const next = event.target.value.toUpperCase();
            const text = document.getElementById(props.id) as HTMLInputElement | null;
            if (text) text.value = next;
            props.onLiveChange(next);
          }}
        />
        <Input
          id={props.id}
          name={props.id}
          defaultValue={props.defaultValue}
          maxLength={7}
          disabled={props.disabled}
          className="uppercase"
          onChange={(event) =>
            props.onLiveChange(event.target.value.toUpperCase())
          }
        />
      </div>
    </div>
  );
}
