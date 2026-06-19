import { redirect } from "next/navigation";

export default async function TeamSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  query.set("section", "team");

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }

  redirect(`/settings?${query.toString()}`);
}
