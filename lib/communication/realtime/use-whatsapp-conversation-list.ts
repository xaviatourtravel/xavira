"use client";

import { useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import {
  mapWhatsappConversationRecord,
  type ConversationListPatch,
} from "@/lib/communication/realtime/map-realtime";
import { createClient } from "@/utils/supabase/client";

const LOG = "[realtime:conversations]";

type Params = {
  organizationId: string;
  enabled?: boolean;
  onConversationChange: (patch: ConversationListPatch) => void;
};

/**
 * Berlangganan perubahan whatsapp_conversations untuk seluruh workspace agar
 * daftar percakapan (preview, waktu, urutan) diperbarui tanpa refresh.
 */
export function useWhatsappConversationListRealtime({
  organizationId,
  enabled = true,
  onConversationChange,
}: Params) {
  useEffect(() => {
    if (!enabled || !organizationId) {
      return;
    }

    const supabase = createClient();
    const filter = `workspace_id=eq.${organizationId}`;
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    const handle = (payload: { new?: unknown }) => {
      console.log(`${LOG} change`, payload.new);
      const patch = mapWhatsappConversationRecord(payload.new);
      if (patch) {
        onConversationChange(patch);
      }
    };

    const start = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error(`${LOG} gagal mengambil sesi`, error);
      }
      const token = data.session?.access_token;
      console.log(`${LOG} mulai berlangganan`, {
        organizationId,
        hasToken: Boolean(token),
      });
      if (token) {
        supabase.realtime.setAuth(token);
      }

      if (cancelled) {
        return;
      }

      channel = supabase.channel(`wa-conversations:${organizationId}`);

      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "whatsapp_conversations",
            filter,
          },
          handle,
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "whatsapp_conversations",
            filter,
          },
          handle,
        )
        .subscribe((status, err) => {
          console.log(`${LOG} status`, status, organizationId);
          if (err) {
            console.error(`${LOG} subscription error`, err);
          }
        });
    };

    void start();

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [organizationId, enabled, onConversationChange]);
}
