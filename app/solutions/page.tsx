import type { Metadata } from "next";

import { SolutionsPageView } from "@/components/marketing/solutions/solutions-page-view";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Desklabs Solutions | Platform untuk berbagai industri",
  description:
    "Desklabs membantu berbagai industri mengelola perjalanan customer dalam satu platform yang didukung AI.",
  openGraph: {
    title: "Desklabs Solutions | Platform untuk berbagai industri",
    description:
      "Desklabs membantu berbagai industri mengelola perjalanan customer dalam satu platform yang didukung AI.",
    url: `${siteConfig.url}/solutions`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SolutionsPage() {
  return <SolutionsPageView />;
}
