import { notFound, redirect } from "next/navigation";

import { BusinessBrainWorkspaceRoot } from "@/modules/business-brain/components/business-brain-workspace-root";
import { loadBusinessBrainWorkspaceData } from "@/modules/business-brain/services/load-business-brain-workspace-data";
import {
  BUSINESS_BRAIN_LEGACY_SECTION_REDIRECTS,
  isBusinessBrainSectionSlug,
  sectionHref,
  sectionLabel,
  sectionSlugFromSegments,
} from "@/modules/business-brain/types/business-brain-workspace";

type BusinessBrainWorkspacePageProps = {
  params: Promise<{ section?: string[] }>;
};

export async function generateMetadata({ params }: BusinessBrainWorkspacePageProps) {
  const { section } = await params;
  const slug = sectionSlugFromSegments(section);

  return {
    title: `${sectionLabel(slug)} · Business Brain · Desklabs`,
  };
}

export default async function BusinessBrainWorkspacePage({
  params,
}: BusinessBrainWorkspacePageProps) {
  const { section } = await params;
  const raw = section?.[0];

  if (raw && raw in BUSINESS_BRAIN_LEGACY_SECTION_REDIRECTS) {
    redirect(sectionHref(BUSINESS_BRAIN_LEGACY_SECTION_REDIRECTS[raw]));
  }

  if (raw && !isBusinessBrainSectionSlug(raw)) {
    notFound();
  }

  const initialSection = sectionSlugFromSegments(section);
  const data = await loadBusinessBrainWorkspaceData();

  return <BusinessBrainWorkspaceRoot initialSection={initialSection} data={data} />;
}
