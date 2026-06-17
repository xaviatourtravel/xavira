import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updateContent } from "../../actions";
import { ContentAiFormFields } from "@/components/content/content-ai-form-fields";
import { ContentFormFields } from "@/components/content/content-form-fields";
import { buttonVariants } from "@/components/ui/button";
import {
  mapSectionsToFormDefaults,
  resolveAiContentSections,
} from "@/lib/content/ai-sections";
import { getOrgCampaignOptions } from "@/lib/campaigns/queries";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

type ContentEdit = {
  id: string;
  title: string;
  platform: string;
  content_type: string;
  status: string;
  campaign_id: string | null;
  assigned_to: string | null;
  publish_date: string | null;
  caption: string | null;
  cta: string | null;
  drive_url: string | null;
  notes: string | null;
  ai_generation_id: string | null;
  ai_content_generations:
    | { generated_output: unknown }
    | { generated_output: unknown }[]
    | null;
};

export default async function EditContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile } = await requireProfile();

  if (!isAdminOrOwner(profile)) {
    redirect(
      "/content?error=Hanya admin atau owner yang dapat mengubah content.",
    );
  }

  const supabase = await createClient();
  const [{ data: content, error }, campaigns, { data: orgProfiles }] =
    await Promise.all([
      supabase
        .from("contents")
        .select(
          `
          id,
          title,
          platform,
          content_type,
          status,
          campaign_id,
          assigned_to,
          publish_date,
          caption,
          cta,
          drive_url,
          notes,
          ai_generation_id,
          ai_content_generations (
            generated_output
          )
        `,
        )
        .eq("id", id)
        .eq("organization_id", profile.organization_id)
        .maybeSingle(),
      getOrgCampaignOptions(supabase, profile.organization_id),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("organization_id", profile.organization_id)
        .order("full_name"),
    ]);

  if (error) {
    throw new Error("Gagal memuat data content.");
  }

  if (!content) {
    notFound();
  }

  const detail = content as ContentEdit;
  const generationRecord = Array.isArray(detail.ai_content_generations)
    ? detail.ai_content_generations[0]
    : detail.ai_content_generations;
  const aiSections = generationRecord
    ? resolveAiContentSections(generationRecord.generated_output)
    : null;
  const aiFormDefaults = aiSections
    ? mapSectionsToFormDefaults(aiSections)
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/content/${detail.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Kembali ke Detail Content
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit Content</h1>
        <p className="text-sm text-muted-foreground">
          Perbarui task content {detail.title}.
        </p>
      </div>

      {query?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(query.error)}
        </div>
      )}

      <form action={updateContent} className="space-y-5 rounded-lg border p-6">
        <input type="hidden" name="content_id" value={detail.id} />

        <ContentFormFields
          campaigns={campaigns}
          profiles={orgProfiles ?? []}
          showManualContentFields={!aiFormDefaults}
          defaultValues={{
            title: detail.title,
            platform: detail.platform,
            contentType: detail.content_type,
            status: detail.status,
            campaignId: detail.campaign_id,
            assignedTo: detail.assigned_to,
            publishDate: detail.publish_date,
            caption: detail.caption,
            cta: detail.cta,
            driveUrl: detail.drive_url,
            notes: detail.notes,
          }}
        />

        {aiFormDefaults && <ContentAiFormFields defaultValues={aiFormDefaults} />}

        <div className="flex gap-3">
          <button type="submit" className={cn(buttonVariants())}>
            Simpan Perubahan
          </button>

          <Link
            href={`/content/${detail.id}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
