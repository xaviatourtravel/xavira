import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { SetupGuideCard } from "@/lib/onboarding/types";
import { cn } from "@/lib/utils";

type SetupGuideCardsProps = {
  cards: SetupGuideCard[];
  className?: string;
};

export function SetupGuideCards({ cards, className }: SetupGuideCardsProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-emerald-200/70 bg-[linear-gradient(to_bottom,#ffffff,#f0fdf4)] p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-emerald-700">
            Langkah selanjutnya
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
            Mulai gunakan Desklabs
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Selesaikan langkah-langkah ini untuk mengaktifkan workflow customer Anda.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="group rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm"
          >
            <h3 className="text-sm font-semibold text-slate-950">{card.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {card.description}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              {card.cta}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
