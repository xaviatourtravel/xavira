import type { Metadata } from "next";

import { CompanyPageView } from "@/components/marketing/company-page-view";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Tentang Desklabs",
  description:
    "Desklabs adalah AI Customer Operating System untuk mengelola seluruh perjalanan customer dalam satu platform yang terhubung.",
  openGraph: {
    title: `Tentang Desklabs | ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: `${siteConfig.url}/company`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CompanyPage() {
  return <CompanyPageView />;
}
