import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-section";
import { SolutionsIndustryCard } from "@/components/marketing/solutions/solutions-industry-card";
import { solutionIndustries } from "@/lib/marketing/solutions-content";

export function SolutionsIndustryGridSection() {
  return (
    <MarketingSection>
      <MarketingSectionHeader
        eyebrow="Industry solution packs"
        title="Satu platform, banyak industri"
        description="Pilih solution pack yang sesuai dengan cara kerja bisnis Anda—tanpa mengganti core platform Desklabs."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {solutionIndustries.map((industry) => (
          <SolutionsIndustryCard
            key={industry.id}
            id={industry.id}
            name={industry.name}
            shortDescription={industry.shortDescription}
            workflows={industry.workflows}
            status={industry.status}
            exploreHref={industry.exploreHref}
            exploreLabel={industry.exploreLabel}
            compact
          />
        ))}
      </div>
    </MarketingSection>
  );
}
