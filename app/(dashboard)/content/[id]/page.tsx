import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentDeleteButton } from "@/components/content/content-delete-button";
import { buttonVariants } from "@/components/ui/button";
import {
  formatContentPlatformLabel,
  formatContentStatusLabel,
  formatContentTypeLabel,
} from "@/lib/content/constants";
import {
  getContentAssigneeName,
  getContentRelationName,
} from "@/lib/content/queries";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { requireProfile } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";

type ContentDetail = {
  id: string;
  title: string;
  platform: string;
  content_type: string;
  status: string;
  caption: string | null;
  cta: string | null;
  drive_url: string | null;
  publish_date: string | null;
  notes: string | null;
  campaign_id: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  campaigns: { id: string; name: string } | { id: string; name: string }[] | null;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

export default async function ContentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile } = await requireProfile();
  const canManageContent = isAdminOrOwner(profile);
  const supabase = await createClient();

  const { data: content, error } = await supabase
    .from("contents")
    .select(
      `
      id,
      title,
      platform,
      content_type,
      status,
      caption,
      cta,
      drive_url,
      publish_date,
      notes,
      campaign_id,
      assigned_to,
      created_at,
      updated_at,
      campaigns (
        id,
        name
      ),
      profiles!contents_assigned_to_fkey (
        full_name
      )
    `,
    )
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (error) {
    throw new Error("Gagal memuat detail content.");
  }

  if (!content) {
    notFound();
  }

  const detail = content as ContentDetail;
  const campaign = Array.isArray(detail.campaigns)
    ? detail.campaigns[0]
    : detail.campaigns;
  const campaignName = getContentRelationName(detail.campaigns);
  const assigneeName = getContentAssigneeName(detail.profiles);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/content"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Kembali ke Content Board
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{detail.title}</h1>
          <p className="text-sm text-muted-foreground">
            Detail task content media.
          </p>
        </div>

        {canManageContent && (
          <div className="flex items-center gap-2">
            <Link
              href={`/content/${detail.id}/edit`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Edit
            </Link>
            <ContentDeleteButton contentId={detail.id} />
          </div>
        )}
      </div>

      {query?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {decodeURIComponent(query.error)}
        </div>
      )}

      {detail.drive_url && (
        <a
          href={detail.drive_url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Buka Drive Asset
        </a>
      )}

      <div className="rounded-xl border p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem
            label="Status"
            value={formatContentStatusLabel(detail.status)}
          />
          <DetailItem
            label="Platform"
            value={formatContentPlatformLabel(detail.platform)}
          />
          <DetailItem
            label="Content Type"
            value={formatContentTypeLabel(detail.content_type)}
          />
          <DetailItem
            label="Campaign"
            value={
              campaign ? (
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {campaignName}
                </Link>
              ) : (
                "-"
              )
            }
          />
          <DetailItem label="Assigned To" value={assigneeName ?? "-"} />
          <DetailItem
            label="Publish Date"
            value={formatDate(detail.publish_date)}
          />
          <DetailItem label="Created At" value={formatDateTime(detail.created_at)} />
          <DetailItem label="Updated At" value={formatDateTime(detail.updated_at)} />
          <DetailItem
            label="Caption"
            value={
              <span className="whitespace-pre-wrap">{detail.caption || "-"}</span>
            }
          />
          <DetailItem label="CTA" value={detail.cta || "-"} />
          <DetailItem
            label="Drive URL"
            value={
              detail.drive_url ? (
                <a
                  href={detail.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-blue-600 hover:underline"
                >
                  {detail.drive_url}
                </a>
              ) : (
                "-"
              )
            }
          />
          <DetailItem
            label="Notes"
            value={
              <span className="whitespace-pre-wrap">{detail.notes || "-"}</span>
            }
          />
        </dl>
      </div>
    </div>
  );
}
