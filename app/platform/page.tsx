import type { Metadata } from "next";

import { PlatformPageView } from "@/components/marketing/platform/platform-page-view";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Platform | AI Customer Operating System",
  description:
    "Desklabs menghubungkan komunikasi, customer, operasional, penjualan, pembayaran, pengetahuan, dan AI dalam satu workflow terintegrasi.",
  openGraph: {
    title: `Platform Desklabs | ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: `${siteConfig.url}/platform`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PlatformPage() {
  return <PlatformPageView />;
}
