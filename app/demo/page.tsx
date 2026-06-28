import type { Metadata } from "next";

import { DemoRequestView } from "@/components/marketing/demo-request-view";

export const metadata: Metadata = {
  title: "Jadwalkan Demo Desklabs",
  description:
    "Ceritakan kebutuhan bisnis Anda dan lihat bagaimana Desklabs membantu workflow operasional customer dalam satu platform.",
  robots: {
    index: true,
    follow: true,
  },
};

type DemoPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const params = await searchParams;

  return <DemoRequestView error={params.error} success={params.success} />;
}
