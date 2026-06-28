import type { Metadata } from "next";

import { LandingPage } from "@/components/marketing/landing-page";
import { siteConfig } from "@/config/site";

const title = "Desklabs — One Platform. Endless Growth.";
const description =
  "Kelola seluruh perjalanan customer dalam satu platform yang didukung AI.";

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
