"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { createClient } from "@/utils/supabase/client";

const LOG = "[realtime:ai-command-center]";

/**
 * Refresh inbox detail when AI-related conversation data changes.
 *
 * Always: create channel → register all postgres_changes handlers → subscribe once.
 * Never add .on() after subscribe(), and never reuse a subscribed channel.
 */
export function useAiCommandCenterRealtime(input: {
  conversationId: string | null;
  organizationId: string;
  enabled?: boolean;
}) {
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const { conversationId, organizationId, enabled = true } = input;

    if (!enabled || !conversationId || !organizationId) {
      return;
    }

    const supabase = createClient();
    const channelName = `ai-command-center:${conversationId}`;
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    const scheduleRefresh = () => {
      if (cancelled) return;
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
      refreshTimer.current = setTimeout(() => {
        if (!cancelled) {
          router.refresh();
        }
      }, 400);
    };

    const start = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;

      if (error) {
        console.error(`${LOG} session error`, error);
        return;
      }

      const token = data.session?.access_token;
      if (token) {
        supabase.realtime.setAuth(token);
      }

      if (cancelled) return;

      // Drop any leftover channel with this name so we never attach .on() to a
      // channel that is already subscribed.
      for (const existing of supabase.getChannels()) {
        if (
          existing.topic === `realtime:${channelName}` ||
          existing.topic.endsWith(`:${channelName}`)
        ) {
          await supabase.removeChannel(existing);
        }
      }

      if (cancelled) return;

      const nextChannel = supabase.channel(channelName);

      nextChannel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ai_events",
          filter: `conversation_id=eq.${conversationId}`,
        },
        scheduleRefresh,
      );

      nextChannel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "whatsapp_conversations",
          filter: `id=eq.${conversationId}`,
        },
        scheduleRefresh,
      );

      nextChannel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_memory",
          filter: `conversation_id=eq.${conversationId}`,
        },
        scheduleRefresh,
      );

      nextChannel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lead_qualification",
          filter: `conversation_id=eq.${conversationId}`,
        },
        scheduleRefresh,
      );

      nextChannel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ai_actions",
          filter: `conversation_id=eq.${conversationId}`,
        },
        scheduleRefresh,
      );

      if (cancelled) {
        void supabase.removeChannel(nextChannel);
        return;
      }

      channel = nextChannel;
      nextChannel.subscribe((status, err) => {
        if (cancelled) return;
        if (err) {
          console.error(`${LOG} subscribe error`, err);
        }
        if (status === "SUBSCRIBED") {
          console.log(`${LOG} subscribed`, conversationId);
        }
      });
    };

    void start();

    return () => {
      cancelled = true;
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }
      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [input.conversationId, input.organizationId, input.enabled, router]);
}
