import {
  ArrowRight,
  Bot,
  BookOpen,
  CreditCard,
  ListTodo,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-section";
import { marketingContent } from "@/lib/marketing/content";

const ICONS = {
  communication: MessageSquare,
  customer: Users,
  tasks: ListTodo,
  sales: TrendingUp,
  finance: CreditCard,
  knowledge: BookOpen,
  ai: Bot,
};

export function MarketingSolutionSection() {
  return (
    <MarketingSection id="platform">
      <MarketingSectionHeader title={marketingContent.solution.title} />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:hidden">
        {marketingContent.solution.items.map((item) => {
          const Icon = ICONS[item.id as keyof typeof ICONS];

          return (
            <article
              key={item.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-950">{item.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {item.description}
              </p>
            </article>
          );
        })}
      </div>

      <div className="mt-12 hidden overflow-x-auto pb-2 lg:block">
        <div className="flex min-w-[720px] items-stretch gap-3">
          {marketingContent.solution.items.map((item, index) => {
            const Icon = ICONS[item.id as keyof typeof ICONS];

            return (
              <div key={item.id} className="flex items-center gap-3">
                <article className="w-44 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 transition-all hover:-translate-y-0.5 hover:ring-emerald-200/80">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-950">{item.label}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                </article>
                {index < marketingContent.solution.items.length - 1 ? (
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </MarketingSection>
  );
}

export function MarketingCapabilitiesSection() {
  return (
    <MarketingSection tone="muted">
      <MarketingSectionHeader title={marketingContent.capabilities.title} />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {marketingContent.capabilities.items.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-all hover:-translate-y-0.5 hover:ring-emerald-200/70"
          >
            <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
          </article>
        ))}
      </div>
    </MarketingSection>
  );
}
