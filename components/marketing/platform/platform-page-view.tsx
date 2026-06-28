import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { PlatformComparisonSection } from "@/components/marketing/platform/platform-comparison-section";
import { PlatformCtaSection } from "@/components/marketing/platform/platform-cta-section";
import { PlatformFlowSection } from "@/components/marketing/platform/platform-flow-section";
import { PlatformHeroSection } from "@/components/marketing/platform/platform-hero-section";
import { PlatformWorkflowStorySection } from "@/components/marketing/platform/platform-workflow-story";
import { ProductSection } from "@/components/marketing/platform/product-section";
import { platformCapabilities } from "@/lib/marketing/platform-content";

export function PlatformPageView() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <MarketingNavbar />
      <main>
        <PlatformHeroSection />
        <PlatformFlowSection />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {platformCapabilities.map((capability, index) => (
            <ProductSection
              key={capability.id}
              id={capability.id}
              eyebrow={capability.eyebrow}
              headline={capability.headline}
              description={capability.description}
              benefits={capability.benefits}
              learnMoreHref={capability.learnMoreHref}
              reverse={index % 2 === 1}
            />
          ))}
        </div>

        <PlatformWorkflowStorySection />
        <PlatformComparisonSection />
        <PlatformCtaSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
