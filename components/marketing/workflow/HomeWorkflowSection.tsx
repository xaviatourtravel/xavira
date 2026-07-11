"use client";

import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/design-system/sections";
import { MotionScene, MotionSectionGroup, MotionSectionItem } from "@/components/marketing/motion";
import { UniversalWorkflowScene } from "@/components/marketing/product-scenes";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";

export function HomeWorkflowSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection rhythm="large">
      <MotionSectionGroup viewport="large">
        <MotionSectionItem>
          <MarketingSectionHeader
            title={content.workflow.title}
            description={content.workflow.description}
          />
        </MotionSectionItem>
      </MotionSectionGroup>

      <MotionScene className="mt-14">
        <UniversalWorkflowScene steps={content.workflow.steps} activeIndex={3} />
      </MotionScene>
    </MarketingSection>
  );
}
