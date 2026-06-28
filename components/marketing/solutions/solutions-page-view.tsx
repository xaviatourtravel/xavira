import { MarketingLocaleProvider } from "@/components/marketing/marketing-locale-provider";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { SolutionsCorePlatformSection } from "@/components/marketing/solutions/solutions-core-platform-section";
import { SolutionsCtaSection } from "@/components/marketing/solutions/solutions-cta-section";
import { SolutionsHeroSection } from "@/components/marketing/solutions/solutions-hero-section";
import { SolutionsIndustryDetail } from "@/components/marketing/solutions/solutions-industry-detail";
import { SolutionsIndustryGridSection } from "@/components/marketing/solutions/solutions-industry-grid";
import { solutionIndustries } from "@/lib/marketing/solutions-content";

export function SolutionsPageView() {
  return (
    <MarketingLocaleProvider>
      <div className="min-h-screen bg-white text-slate-950">
      <MarketingNavbar />
      <main>
        <SolutionsHeroSection />
        <SolutionsIndustryGridSection />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {solutionIndustries.map((industry, index) => (
            <SolutionsIndustryDetail
              key={industry.id}
              id={industry.id}
              name={industry.name}
              headline={industry.detailHeadline}
              description={industry.detailDescription}
              workflows={industry.workflows}
              status={industry.status}
              exploreHref={industry.exploreHref}
              exploreLabel={industry.exploreLabel}
              reverse={index % 2 === 1}
            />
          ))}
        </div>

        <SolutionsCorePlatformSection />
        <SolutionsCtaSection />
      </main>
      <MarketingFooter />
    </div>
    </MarketingLocaleProvider>
  );
}
