import type { Metadata } from "next";

import { LandingPage } from "@/components/marketing/landing-page";
import { siteConfig } from "@/config/site";

const title = "Desklabs — Customer Operations Platform for Service Businesses";
const description =
  "Satukan komunikasi, CRM, operasional, keuangan, automasi, dan AI dalam satu workspace untuk bisnis berbasis layanan.";

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
};

export default function HomePage() {
  return <LandingPage />;
}
