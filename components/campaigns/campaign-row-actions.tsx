"use client";

import Link from "next/link";

import { deleteCampaign } from "@/app/(dashboard)/campaigns/actions";

type CampaignRowActionsProps = {
  campaignId: string;
};

export function CampaignRowActions({ campaignId }: CampaignRowActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/campaigns/${campaignId}/edit`}
        className="rounded border border-blue-600 px-2 py-1 text-xs text-blue-600"
      >
        Edit
      </Link>

      <form
        action={deleteCampaign}
        onSubmit={(event) => {
          if (!confirm("Yakin ingin menghapus campaign ini?")) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="campaign_id" value={campaignId} />
        <button
          type="submit"
          className="rounded border border-red-600 px-2 py-1 text-xs text-red-600"
        >
          Hapus
        </button>
      </form>
    </div>
  );
}
