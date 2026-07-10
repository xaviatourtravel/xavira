"use client";

import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/design-system/sections";
import { UniversalWorkflowScene } from "@/components/marketing/product-scenes";
import { useMarketingContent } from "@/components/marketing/marketing-locale-provider";

export function HomeWorkflowSection() {
  const { content } = useMarketingContent();

  return (
    <MarketingSection rhythm="large">
      <MarketingSectionHeader
        title={content.workflow.title}
        description={content.workflow.description}
      />

      <UniversalWorkflowScene steps={content.workflow.steps} className="mt-14" activeIndex={3} />
    </MarketingSection>
  );
}
