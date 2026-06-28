import { isTravelPackEnabled } from "@/lib/onboarding/solution-packs";
import { getOrganizationProductFromSettings } from "@/lib/onboarding/status";
import type { SetupGuideCard } from "@/lib/onboarding/types";
import type { Tables } from "@/types/database";
import type { createClient } from "@/utils/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type Profile = Pick<Tables<"profiles">, "organization_id" | "role">;
type Organization = Pick<Tables<"organizations">, "settings">;

export async function loadSetupGuideCards(
  supabase: SupabaseServerClient,
  profile: Profile,
  organization: Organization,
): Promise<SetupGuideCard[]> {
  if (profile.role !== "owner" && profile.role !== "admin") {
    return [];
  }

  const orgId = profile.organization_id;
  const product = getOrganizationProductFromSettings(organization);
  const cards: SetupGuideCard[] = [];

  const [
    { count: leadCount },
    { count: conversationCount },
    { count: memberCount },
    { count: inviteCount },
    { count: packageCount },
    { data: integrations },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabase
      .from("organization_invites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "pending"),
    supabase
      .from("packages")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabase
      .from("integrations")
      .select("provider, status")
      .eq("organization_id", orgId),
  ]);

  const hasConnectedChannel =
    (integrations ?? []).some(
      (integration) =>
        integration.status === "connected" ||
        integration.status === "active",
    ) || (conversationCount ?? 0) > 0;

  if ((leadCount ?? 0) === 0) {
    cards.push({
      id: "leads",
      title: "Buat Lead pertama Anda",
      description:
        "Mulai lacak calon customer dan pipeline penjualan dari satu tempat.",
      href: "/leads/new",
      cta: "Buat Lead",
    });
  }

  if (!hasConnectedChannel) {
    cards.push({
      id: "inbox",
      title: "Hubungkan channel komunikasi",
      description:
        "Sambungkan Instagram atau channel lain agar percakapan customer masuk ke Inbox.",
      href: "/settings/integrations",
      cta: "Hubungkan channel",
    });
  }

  const hasTeam =
    (memberCount ?? 0) > 1 || (inviteCount ?? 0) > 0;

  if (!hasTeam) {
    cards.push({
      id: "team",
      title: "Undang anggota tim",
      description:
        "Ajak tim sales, marketing, atau finance bekerja dalam workspace yang sama.",
      href: "/settings/team",
      cta: "Undang tim",
    });
  }

  if (
    isTravelPackEnabled(product) &&
    (packageCount ?? 0) === 0
  ) {
    cards.push({
      id: "packages",
      title: "Buat Package pertama",
      description:
        "Tambahkan paket perjalanan agar tim bisa memproses inquiry dan booking.",
      href: "/packages/new",
      cta: "Buat Package",
    });
  }

  return cards;
}
