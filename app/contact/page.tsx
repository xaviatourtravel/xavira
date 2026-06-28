import type { Metadata } from "next";

import { ContactPageView } from "@/components/marketing/contact-page-view";

export const metadata: Metadata = {
  title: "Hubungi Desklabs",
  description:
    "Hubungi tim Desklabs untuk demo, partnership, dukungan, billing, dan pertanyaan platform AI Customer Operating System.",
  robots: {
    index: true,
    follow: true,
  },
};

type ContactPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;

  return <ContactPageView error={params.error} success={params.success} />;
}
