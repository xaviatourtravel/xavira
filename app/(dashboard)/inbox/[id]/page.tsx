import { redirect } from "next/navigation";

export default async function LegacyInboxConversationRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string; error?: string; success?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const url = new URLSearchParams();

  if (query.filter) {
    url.set("filter", query.filter);
  }

  url.set("c", id);

  if (query.error) {
    url.set("error", query.error);
  }

  if (query.success) {
    url.set("success", query.success);
  }

  redirect(`/inbox?${url.toString()}`);
}
