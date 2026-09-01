import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    lifecycle?: string;
    payment?: string;
    archive?: string;
    deleted?: string;
    archived?: string;
  }>;
};

export default async function FinanceInvoicesIndexPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const suffix = query.toString();
  redirect(`/finance/invoices/xavia${suffix ? `?${suffix}` : ""}`);
}
