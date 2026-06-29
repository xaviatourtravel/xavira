import { redirect } from "next/navigation";

type LeadDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LeadDetailPage({
  params,
  searchParams,
}: LeadDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.length > 0) {
      search.set(key, value);
    }
  }

  const suffix = search.toString() ? `?${search.toString()}` : "";
  redirect(`/customers/${id}${suffix}`);
}
