"use client";

import Link from "next/link";
import { ArrowRight, Layers, MessageCircle, Sparkles } from "lucide-react";

import { MarketingPageShell } from "@/components/marketing/design-system";
import { marketingButtonVariants } from "@/components/marketing/design-system/button";
import { marketingContainerClass } from "@/components/marketing/design-system/tokens/spacing";
import { marketingTypography } from "@/components/marketing/design-system/tokens/typography";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { marketingRoutes } from "@/lib/marketing/routes";
import { cn } from "@/lib/utils";

const PILLARS = [
  {
    icon: MessageCircle,
    title: "Percakapan customer sebagai titik awal",
    description:
      "Setiap workflow berawal dari percakapan customer, bukan dari spreadsheet yang terpisah.",
  },
  {
    icon: Layers,
    title: "Satu platform terhubung",
    description:
      "Komunikasi, konteks pelanggan, task, penjualan, keuangan, knowledge, dan AI dalam satu tempat.",
  },
  {
    icon: Sparkles,
    title: "Operasional berbantuan AI",
    description:
      "AI membantu merangkum, menyarankan tindakan, dan mempercepat keputusan tanpa mengambil alih kontrol tim.",
  },
];

export function CompanyPageView() {
  const { content } = useMarketingContent();

  return (
    <MarketingPageShell>
      <MarketingNavbar />

      <main>
        <section className={cn(marketingContainerClass, "py-16 sm:py-20")}>
          <div className="marketing-prose">
            <p className={marketingTypography.eyebrow}>Company</p>
            <h1 className={cn(marketingTypography.h1, "mt-3")}>Desklabs</h1>
            <p className="mt-4 text-lg font-medium text-slate-800">
              {content.brand.tagline}
            </p>
            <p className={cn(marketingTypography.bodyLarge, "mt-4")}>
              Desklabs adalah{" "}
              <span className="font-medium text-slate-900">
                AI Customer Operating System
              </span>
              , platform untuk mengelola seluruh perjalanan customer dari
              percakapan pertama hingga layanan pasca-transaksi.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article
                  key={pillar.title}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[var(--marketing-border-default)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-slate-950">
                    {pillar.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {pillar.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-y border-slate-200/70 bg-white/70">
          <div
            className={cn(
              marketingContainerClass,
              "grid gap-10 py-16 lg:grid-cols-2 lg:items-center lg:py-20",
            )}
          >
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Dibangun dari kebutuhan operasional nyata
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Desklabs was built from real operational needs: customer
                conversations, follow-ups, sales, payments, and internal
                workflows were scattered across too many tools.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Tim customer-facing kehilangan konteks. Follow up terlewat.
                Keputusan lambat. Desklabs hadir untuk merapikan operasional
                customer dalam satu platform yang terhubung.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 p-8 text-white shadow-[var(--marketing-shadow-float)]">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--marketing-accent-secondary)]">
                Mission
              </p>
              <p className="mt-4 text-xl leading-relaxed text-slate-100">
                Membantu bisnis mengelola seluruh perjalanan customer dalam satu
                platform yang lebih sederhana, terhubung, dan didukung AI.
              </p>
              <blockquote className="mt-8 border-l-2 border-[var(--marketing-brand-500)] pl-4 text-lg italic text-slate-200">
                “Kami percaya setiap customer berawal dari sebuah percakapan.”
              </blockquote>
            </div>
          </div>
        </section>

        <section className={cn(marketingContainerClass, "py-16 lg:py-20")}>
          <div className="rounded-2xl bg-[radial-gradient(circle_at_top_right,rgba(45,115,213,0.12),transparent_45%),linear-gradient(to_bottom,var(--marketing-background),var(--marketing-surface))] p-8 ring-1 ring-[var(--marketing-border-default)] sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight">
              Siap melihat Desklabs untuk bisnis Anda?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Jadwalkan demo untuk melihat workflow operasional customer, atau
              hubungi tim kami untuk pertanyaan partnership dan dukungan.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={marketingRoutes.demo}
                className={cn(marketingButtonVariants({ size: "lg" }))}
              >
                Coba Demo
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href={marketingRoutes.contact}
                className={cn(marketingButtonVariants({ variant: "outline", size: "lg" }))}
              >
                Hubungi Kami
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingPageShell>
  );
}
