"use client";

import { useState } from "react";

import { createInboxConversation } from "@/app/(dashboard)/inbox/actions";
import { CampaignSelect } from "@/components/campaigns/campaign-select";
import { Button } from "@/components/ui/button";
import { INBOX_SOURCES, formatInboxSourceLabel } from "@/lib/inbox/constants";

type NewConversationPanelProps = {
  campaigns: ReadonlyArray<{ id: string; name: string }>;
};

export function NewConversationPanel({ campaigns }: NewConversationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">New Conversation</h2>
          <p className="text-sm text-muted-foreground">
            Catat DM Instagram atau Facebook secara manual untuk lead capture.
          </p>
        </div>
        <Button
          type="button"
          variant={isOpen ? "outline" : "default"}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? "Tutup" : "Tambah Percakapan"}
        </Button>
      </div>

      {isOpen && (
        <form action={createInboxConversation} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="source" className="text-sm font-medium">
                Source
              </label>
              <select
                id="source"
                name="source"
                required
                defaultValue="instagram"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              >
                {INBOX_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {formatInboxSourceLabel(source)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="contact_name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="contact_name"
                name="contact_name"
                required
                placeholder="Nama kontak"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="contact_handle" className="text-sm font-medium">
                Handle / Username
              </label>
              <input
                id="contact_handle"
                name="contact_handle"
                placeholder="@username"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="campaign_id" className="text-sm font-medium">
                Campaign
              </label>
              <CampaignSelect
                campaigns={campaigns}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="last_message" className="text-sm font-medium">
              Last Message
            </label>
            <textarea
              id="last_message"
              name="last_message"
              rows={3}
              placeholder="Ringkasan pesan terakhir dari DM"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <Button type="submit">Simpan Percakapan</Button>
        </form>
      )}
    </div>
  );
}
