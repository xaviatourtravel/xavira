import { MarketingPageShell } from "@/components/marketing/design-system";
import { MarketingCapabilitiesSection } from "@/components/marketing/marketing-solution-section";
import { MarketingComparisonSection } from "@/components/marketing/marketing-comparison-section";
import { MarketingCtaSection } from "@/components/marketing/marketing-cta-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeroSection } from "@/components/marketing/marketing-hero-section";
import { MarketingIndustriesSection } from "@/components/marketing/marketing-industries-section";
import { MarketingJourneySection } from "@/components/marketing/marketing-journey-section";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { MarketingProblemSection } from "@/components/marketing/marketing-problem-section";
import { MarketingSolutionSection } from "@/components/marketing/marketing-solution-section";
import { MarketingTrustSection } from "@/components/marketing/marketing-trust-section";

export function LandingPage() {
  return (
    <MarketingPageShell>
      <MarketingNavbar />
      <main>
        <MarketingHeroSection />
        <MarketingProblemSection />
        <MarketingSolutionSection />
        <MarketingCapabilitiesSection />
        <MarketingIndustriesSection />
        <MarketingJourneySection />
        <MarketingComparisonSection />
        <MarketingTrustSection />
        <MarketingCtaSection />
      </main>
      <MarketingFooter />
    </MarketingPageShell>
  );
}
