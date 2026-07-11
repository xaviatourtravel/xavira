"use client";

import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/design-system/sections";
import {
  MotionScene,
  MotionSectionGroup,
  MotionSectionItem,
} from "@/components/marketing/motion";
import { PlatformCoreScene } from "@/components/marketing/product-scenes";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";

export function HomePlatformCoreSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection id="platform" rhythm="compact">
      <MotionSectionGroup viewport="large">
        <MotionSectionItem>
          <MarketingSectionHeader
            title={content.platformCore.title}
            description={content.platformCore.description}
          />
        </MotionSectionItem>
      </MotionSectionGroup>

      <MotionScene className="mt-12 lg:mt-14">
        <PlatformCoreScene modules={content.platformCore.modules} />
      </MotionScene>
    </MarketingSection>
  );
}
