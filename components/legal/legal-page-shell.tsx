import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CONTACT_EMAIL = "xaviatourtravel@gmail.com";

type LegalPageShellProps = {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
};

export function LegalPageShell({
  title,
  lastUpdated = "June 2026",
  children,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center">
            <BrandLogo variant="full" size="md" />
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <article className="rounded-xl border bg-background p-6 shadow-sm sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>

          <div className="prose prose-neutral mt-8 max-w-none space-y-4 text-sm leading-relaxed text-foreground sm:text-base">
            {children}
          </div>

          <footer className="mt-10 border-t pt-6 text-sm text-muted-foreground">
            <p>
              Questions? Contact us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <Link href="/privacy-policy" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
              <Link href="/data-deletion" className="hover:underline">
                Data Deletion
              </Link>
            </div>
          </footer>
        </article>
      </main>
    </div>
  );
}
