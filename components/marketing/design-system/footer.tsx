"use client";

import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
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
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
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
    <footer id="company" className="border-t border-slate-200 bg-white">
      <div className={cn(marketingContainerClass, "py-16")}>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
          <div>
            <Link
              href="/"
              className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <BrandLogo variant="full" size="md" />
            </Link>
            <p className="mt-4 text-sm text-slate-600">{content.brand.tagline}</p>
            <a
              href={`mailto:${content.brand.email}`}
              className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              {content.brand.email}
            </a>
          </div>

          <FooterColumn
            title={content.footer.columnTitles.platform}
            links={content.footer.platform}
          />
          <FooterColumn
            title={content.footer.columnTitles.solutions}
            links={content.footer.solutions}
          />
          <FooterColumn
            title={content.footer.columnTitles.resources}
            links={content.footer.resources}
          />
          <FooterColumn
            title={content.footer.columnTitles.company}
            links={content.footer.company}
          />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-100 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Desklabs. {legal.copyright}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy-policy" className="hover:text-slate-800">
              {legal.privacy}
            </Link>
            <Link href="/terms" className="hover:text-slate-800">
              {legal.terms}
            </Link>
            <Link href="/data-deletion" className="hover:text-slate-800">
              {legal.dataDeletion}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
