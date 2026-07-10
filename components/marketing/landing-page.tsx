import { AuroraAiSection } from "@/components/marketing/aurora/AuroraAiSection";
import { MarketingPageShell } from "@/components/marketing/design-system";
import { MarketingFaqSection } from "@/components/marketing/faq/MarketingFaqSection";
import { HomeHeroSection } from "@/components/marketing/hero/HomeHeroSection";
import { HomeIndustriesSection } from "@/components/marketing/industries/HomeIndustriesSection";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { HomePlatformCoreSection } from "@/components/marketing/platform/HomePlatformCoreSection";
import { HomePricingSection } from "@/components/marketing/pricing/HomePricingSection";
import { HomeProblemsSection } from "@/components/marketing/problems/HomeProblemsSection";
import { HomeProductModulesSection } from "@/components/marketing/product-modules/HomeProductModulesSection";
import { HomeProofSection } from "@/components/marketing/proof/HomeProofSection";
import { FinalCtaSection } from "@/components/marketing/shared/FinalCtaSection";
import { TrustRelevanceStrip } from "@/components/marketing/trust/TrustRelevanceStrip";
import { HomeWorkflowSection } from "@/components/marketing/workflow/HomeWorkflowSection";

export function LandingPage() {
  return (
    <MarketingPageShell>
      <MarketingNavbar />
      <main>
        <HomeHeroSection />
        <TrustRelevanceStrip />
        <HomeIndustriesSection />
        <HomeProblemsSection />
        <HomePlatformCoreSection />
        <HomeProductModulesSection />
        <AuroraAiSection />
        <HomeWorkflowSection />
        <HomeProofSection />
        <HomePricingSection />
        <MarketingFaqSection />
        <FinalCtaSection />
      </main>
      <MarketingFooter />
    </MarketingPageShell>
  );
}
