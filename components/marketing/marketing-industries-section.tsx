import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-section";
import { marketingContent } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

function IndustryStatusBadge({ status }: { status: "available" | "coming_soon" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        status === "available"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600",
      )}
    >
      {status === "available" ? "Available" : "Coming Soon"}
    </span>
  );
}

export function MarketingIndustriesSection() {
  return (
    <MarketingSection id="solutions">
      <MarketingSectionHeader
        title={marketingContent.industries.title}
        description={marketingContent.industries.subtitle}
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {marketingContent.industries.items.map((industry) => (
          <article
            key={industry.name}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70 transition-all hover:-translate-y-0.5 hover:ring-emerald-200/70"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-950">{industry.name}</h3>
              <IndustryStatusBadge status={industry.status} />
            </div>

            <ul className="mt-4 space-y-2">
              {industry.modules.map((module) => (
                <li
                  key={module}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                  {module}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </MarketingSection>
  );
}
