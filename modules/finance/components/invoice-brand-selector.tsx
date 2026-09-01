"use client";

import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvoiceBrandEditorOption } from "@/modules/finance/lib/invoice-brand-profiles";

type InvoiceBrandSelectorProps = {
  brands: InvoiceBrandEditorOption[];
  selectedBrandId: string;
  onChange: (brandId: string) => void;
};

export function InvoiceBrandSelector({
  brands,
  selectedBrandId,
  onChange,
}: InvoiceBrandSelectorProps) {
  const { tStrict } = useTranslation();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          {tStrict("financeUi.sectionBranding")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {tStrict("financeUi.brandSelectorHint")}
        </p>
      </div>

      <div
        className="grid gap-3 sm:grid-cols-2"
        role="radiogroup"
        aria-label={tStrict("financeUi.sectionBranding")}
      >
        {brands.map((brand) => {
          const selected = brand.id === selectedBrandId;
          const issuer =
            brand.legalName || brand.displayName || brand.name;
          return (
            <button
              key={brand.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(brand.id)}
              className={`rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "hover:border-foreground/20"
              }`}
            >
              <div className="flex items-center gap-3">
                {brand.logoPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logoPreviewUrl}
                    alt=""
                    className="h-10 w-10 rounded border bg-white object-contain p-1"
                  />
                ) : (
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded border bg-muted text-xs font-semibold"
                    aria-hidden
                  >
                    {(issuer || "?").slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{brand.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {issuer}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {[brand.email, brand.phone].filter(Boolean).join(" · ") ||
                  tStrict("financeUi.brandIdentityEmpty")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {brand.bankSummary || tStrict("financeUi.brandBankNone")}
              </p>
            </button>
          );
        })}
      </div>
      <input type="hidden" name="brand_profile_id" value={selectedBrandId} />
    </section>
  );
}
