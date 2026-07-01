import Image from "next/image";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { branding } from "@/config/branding";
import { brandLogoRules, brandPalette } from "@/lib/design-system/brand-tokens";
import {
  DsBody,
  DsCaption,
  DsH3,
  DsShowcaseGrid,
  DsShowcaseRow,
} from "@/components/design-system/typography";
import { cn } from "@/lib/utils";

function LogoPanel({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-soft p-8",
        className,
      )}
    >
      {children}
      <DsCaption className="mt-4 text-center">{label}</DsCaption>
    </div>
  );
}

function RuleItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span>{children}</span>
    </li>
  );
}

export function BrandIdentitySection() {
  return (
    <div className="space-y-10">
      <DsShowcaseGrid columns={2}>
        <LogoPanel label="Full logo — light mode" className="bg-card">
          <BrandLogo variant="full" size="lg" />
        </LogoPanel>
        <LogoPanel label="Full logo — dark mode" className="dark bg-slate-950">
          <BrandLogo variant="full" size="lg" />
        </LogoPanel>
        <LogoPanel label="Icon mark" className="bg-card">
          <BrandLogo variant="icon" size="lg" />
        </LogoPanel>
        <LogoPanel
          label="Favicon"
          className="bg-muted/40"
        >
          <Image
            src={branding.favicon}
            alt="Desklabs favicon"
            width={32}
            height={32}
            className="h-8 w-8"
          />
        </LogoPanel>
      </DsShowcaseGrid>

      <div>
        <DsH3 className="mb-3">Ukuran logo</DsH3>
        <DsShowcaseRow>
          <BrandLogo variant="full" size="sm" />
          <BrandLogo variant="full" size="md" />
          <BrandLogo variant="full" size="lg" />
        </DsShowcaseRow>
        <DsCaption className="mt-2">
          Small (28px) · Medium (32px) · Large (34px) tinggi — proporsi aspek
          dipertahankan.
        </DsCaption>
      </div>

      <div>
        <DsH3 className="mb-3">Icon only</DsH3>
        <DsShowcaseRow>
          <BrandLogo variant="icon" size="sm" />
          <BrandLogo variant="icon" size="md" />
          <BrandLogo variant="icon" size="lg" />
        </DsShowcaseRow>
      </div>

      <div>
        <DsH3 className="mb-3">Palet warna brand</DsH3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(brandPalette).map((color) => (
            <div
              key={color.label}
              className="overflow-hidden rounded-xl border border-soft bg-card"
            >
              <div
                className="h-14 w-full"
                style={{ backgroundColor: color.hex }}
              />
              <div className="space-y-0.5 p-3">
                <p className="text-sm font-medium text-foreground">{color.label}</p>
                <p className="font-mono text-xs text-muted-foreground">{color.hex}</p>
                <p className="text-xs text-muted-foreground">{color.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <DsH3 className="mb-3">Aturan penggunaan</DsH3>
        <ul className="space-y-2">
          <RuleItem>
            Gunakan komponen <code className="rounded bg-muted px-1 text-xs">BrandLogo</code>{" "}
            saja — jangan mengetik &quot;Desklabs&quot; sebagai pengganti logo.
          </RuleItem>
          <RuleItem>
            Tinggi minimum wordmark: {brandLogoRules.minHeightFull}px. Icon:{" "}
            {brandLogoRules.minHeightIcon}px.
          </RuleItem>
          <RuleItem>Clear space: {brandLogoRules.clearSpace}.</RuleItem>
          <RuleItem>Jangan meregangkan atau memotong logo.</RuleItem>
          <RuleItem>Jangan mewarnai ulang logo secara manual.</RuleItem>
          <RuleItem>
            Light mode → <code className="text-xs">{branding.logo}</code>. Dark mode →
            versi light-ink yang dapat dibaca.
          </RuleItem>
        </ul>
      </div>

      <div>
        <DsH3 className="mb-3">Contoh konteks</DsH3>
        <DsShowcaseGrid columns={2}>
          <div className="rounded-xl border border-soft bg-sidebar px-4 py-3">
            <DsCaption className="mb-2">Sidebar (expanded)</DsCaption>
            <BrandLogo variant="full" size="md" />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-soft bg-sidebar px-4 py-3">
            <DsCaption className="sr-only">Sidebar compact</DsCaption>
            <BrandLogo variant="icon" size="md" />
            <DsBody className="text-muted-foreground">Menu navigasi</DsBody>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-xl border border-soft bg-muted/30 px-6 py-8">
            <DsCaption>Loading</DsCaption>
            <BrandLogo variant="icon" size="lg" />
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-soft bg-card px-6 py-8">
            <DsCaption>Empty state</DsCaption>
            <BrandLogo variant="icon" size="sm" />
            <DsBody className="text-center text-muted-foreground">
              Belum ada data
            </DsBody>
          </div>
        </DsShowcaseGrid>
      </div>
    </div>
  );
}
