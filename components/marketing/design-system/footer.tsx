"use client";

import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { marketingContainerClass } from "@/components/marketing/design-system/tokens/spacing";
import { cn } from "@/lib/utils";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--marketing-foreground)]">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className={cn("text-sm text-[var(--marketing-muted)] transition-colors hover:text-[var(--marketing-foreground)]", marketingColorClasses.focusRing)}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketingDesignFooter() {
  const { content, locale } = useMarketingContent();
  const legal =
    locale === "en"
      ? {
          copyright: "All rights reserved.",
          privacy: "Privacy Policy",
          terms: "Terms",
          dataDeletion: "Data Deletion",
        }
      : {
          copyright: "Hak cipta dilindungi.",
          privacy: "Kebijakan Privasi",
          terms: "Syarat Layanan",
          dataDeletion: "Penghapusan Data",
        };

  return (
    <footer className="border-t border-[var(--marketing-border-default)] bg-[var(--marketing-elevated-surface)]">
      <div className={cn(marketingContainerClass, "py-16 lg:py-20")}>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
          <div>
            <Link href="/" className={cn("inline-flex", marketingColorClasses.focusRing)}>
              <BrandLogo variant="full" size="md" />
            </Link>
            <p className="mt-4 text-sm text-[var(--marketing-muted)]">{content.brand.tagline}</p>
            <p className="mt-2 text-sm text-[var(--marketing-muted-foreground)]">
              {content.footer.statement}
            </p>
            <a
              href={`mailto:${content.brand.email}`}
              className={cn("mt-3 inline-block text-sm font-medium", marketingColorClasses.link, marketingColorClasses.focusRing)}
            >
              {content.brand.email}
            </a>
          </div>

          <FooterColumn title={content.footer.columnTitles.platform} links={content.footer.platform} />
          <FooterColumn
            title={content.footer.columnTitles.industries}
            links={content.footer.industries}
          />
          <FooterColumn title={content.footer.columnTitles.company} links={content.footer.company} />
          <FooterColumn
            title={content.footer.columnTitles.resources}
            links={content.footer.resources}
          />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--marketing-border-subtle)] pt-6 text-sm text-[var(--marketing-muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Desklabs. {legal.copyright}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy-policy" className="hover:text-[var(--marketing-foreground)]">
              {legal.privacy}
            </Link>
            <Link href="/terms" className="hover:text-[var(--marketing-foreground)]">
              {legal.terms}
            </Link>
            <Link href="/data-deletion" className="hover:text-[var(--marketing-foreground)]">
              {legal.dataDeletion}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
