"use client";

import { listInvoiceTemplates } from "@/modules/finance/pdf/invoice-template-registry";
import type { InvoiceTemplateKey } from "@/modules/finance/pdf/invoice-pdf-types";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvoiceTemplateThumbnail } from "@/modules/finance/components/invoice-template-thumbnail";

type InvoiceTemplateBrandingFieldsProps = {
  templateKey: InvoiceTemplateKey | string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  workspaceDefaults: {
    templateKey: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  onChange: (next: {
    templateKey: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  }) => void;
};

export function InvoiceTemplateBrandingFields({
  templateKey,
  primaryColor,
  secondaryColor,
  accentColor,
  workspaceDefaults,
  onChange,
}: InvoiceTemplateBrandingFieldsProps) {
  const { tStrict } = useTranslation();
  const templates = listInvoiceTemplates();
  const isOverride =
    templateKey !== workspaceDefaults.templateKey ||
    primaryColor.toUpperCase() !== workspaceDefaults.primaryColor.toUpperCase() ||
    secondaryColor.toUpperCase() !==
      workspaceDefaults.secondaryColor.toUpperCase() ||
    accentColor.toUpperCase() !== workspaceDefaults.accentColor.toUpperCase();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          {tStrict("financeUi.sectionTemplateBranding")}
        </h2>
        {isOverride ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {tStrict("financeUi.invoiceBrandOverrideHint")}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((template) => {
          const selected = template.key === templateKey;
          return (
            <button
              key={template.key}
              type="button"
              onClick={() =>
                onChange({
                  templateKey: template.key,
                  primaryColor,
                  secondaryColor,
                  accentColor,
                })
              }
              className={`rounded-xl border p-3 text-left transition-colors ${
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "hover:border-foreground/20"
              }`}
              aria-pressed={selected}
            >
              <InvoiceTemplateThumbnail
                templateKey={template.key}
                primaryColor={primaryColor}
                accentColor={accentColor}
              />
              <p className="text-sm font-medium">{template.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {template.description}
              </p>
            </button>
          );
        })}
      </div>
      <input type="hidden" name="template_key" value={templateKey} />

      <div className="grid gap-4 md:grid-cols-3">
        <ColorField
          id="primary_color"
          label={tStrict("financeUi.primaryColor")}
          value={primaryColor}
          onChange={(value) =>
            onChange({
              templateKey,
              primaryColor: value,
              secondaryColor,
              accentColor,
            })
          }
        />
        <ColorField
          id="secondary_color"
          label={tStrict("financeUi.secondaryColor")}
          value={secondaryColor}
          onChange={(value) =>
            onChange({
              templateKey,
              primaryColor,
              secondaryColor: value,
              accentColor,
            })
          }
        />
        <ColorField
          id="accent_color"
          label={tStrict("financeUi.accentColor")}
          value={accentColor}
          onChange={(value) =>
            onChange({
              templateKey,
              primaryColor,
              secondaryColor,
              accentColor: value,
            })
          }
        />
      </div>

      <button
        type="button"
        className="text-sm font-medium text-primary hover:underline"
        onClick={() =>
          onChange({
            templateKey: workspaceDefaults.templateKey,
            primaryColor: workspaceDefaults.primaryColor,
            secondaryColor: workspaceDefaults.secondaryColor,
            accentColor: workspaceDefaults.accentColor,
          })
        }
      >
        {tStrict("financeUi.resetBrandDefaults")}
      </button>
    </section>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#0F172A"}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          aria-label={label}
          className="h-10 w-10 cursor-pointer rounded border bg-transparent p-1"
        />
        <Input
          id={id}
          name={id}
          value={value}
          maxLength={7}
          className="uppercase"
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
      </div>
    </div>
  );
}
