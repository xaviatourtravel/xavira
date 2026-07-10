"use client";

import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/design-system/sections";
import { PlatformCoreScene } from "@/components/marketing/product-scenes";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";

export function HomePlatformCoreSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection id="platform" rhythm="compact">
      <MarketingSectionHeader
        title={content.platformCore.title}
        description={content.platformCore.description}
      />

      <PlatformCoreScene modules={content.platformCore.modules} className="mt-12 lg:mt-14" />
    </MarketingSection>
  );
}
