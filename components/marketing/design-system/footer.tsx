import Link from "next/link";

import { marketingContainerClass } from "@/components/marketing/design-system/tokens/spacing";
import { marketingContent } from "@/lib/marketing/content";
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

/** Design-system footer — use on all public marketing pages */
export function MarketingDesignFooter() {
  return (
    <footer id="company" className="border-t border-slate-200 bg-white">
      <div className={cn(marketingContainerClass, "py-16")}>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <span
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white"
              >
                D
              </span>
              <span className="text-lg font-semibold tracking-tight text-slate-950">
                {marketingContent.brand.name}
              </span>
            </Link>
            <p className="mt-4 text-sm text-slate-600">{marketingContent.brand.tagline}</p>
            <a
              href={`mailto:${marketingContent.brand.email}`}
              className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              {marketingContent.brand.email}
            </a>
          </div>

          <FooterColumn title="Platform" links={marketingContent.footer.platform} />
          <FooterColumn title="Solutions" links={marketingContent.footer.solutions} />
          <FooterColumn title="Resources" links={marketingContent.footer.resources} />
          <FooterColumn title="Company" links={marketingContent.footer.company} />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-100 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Desklabs. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy-policy" className="hover:text-slate-800">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-800">
              Terms
            </Link>
            <Link href="/data-deletion" className="hover:text-slate-800">
              Data Deletion
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
