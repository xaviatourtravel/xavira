"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { mapWhatsappRecordToMessageRow } from "@/lib/communication/realtime/map-realtime";
import type { MessageRow } from "@/types/omnichannel-inbox";
import { createClient } from "@/utils/supabase/client";

const LOG = "[realtime:messages]";

type Params = {
  conversationId: string;
  enabled: boolean;
  initialMessages: MessageRow[];
};

let tempCounter = 0;

function nextTempId() {
  tempCounter += 1;
  return `temp-${Date.now()}-${tempCounter}`;
}

export function isOptimisticId(id: string) {
  return id.startsWith("temp-");
}

function sameOutgoingText(message: MessageRow, text: string | null) {
  return (
    isOptimisticId(message.id) &&
    message.direction === "outgoing" &&
    (message.message_text ?? "") === (text ?? "")
  );
}

function applyInsert(prev: MessageRow[], row: MessageRow): MessageRow[] {
  // Baris asli sudah ada -> abaikan (hindari duplikat).
  if (prev.some((message) => message.id === row.id)) {
    return prev;
  }

  // Ganti pesan optimistik sementara yang cocok (keluar, teks sama).
  if (row.direction === "outgoing") {
    const index = prev.findIndex((message) =>
      sameOutgoingText(message, row.message_text),
    );
    if (index >= 0) {
      const next = [...prev];
      next[index] = row;
      return next;
    }
  }

  return [...prev, row];
}

function applyUpdate(prev: MessageRow[], row: MessageRow): MessageRow[] {
  const index = prev.findIndex((message) => message.id === row.id);
  if (index >= 0) {
    const next = [...prev];
    next[index] = { ...next[index], ...row };
    return next;
  }

  // UPDATE tiba sebelum INSERT diproses -> coba cocokkan pesan optimistik.
  if (row.direction === "outgoing") {
    const tempIndex = prev.findIndex((message) =>
      sameOutgoingText(message, row.message_text),
    );
    if (tempIndex >= 0) {
      const next = [...prev];
      next[tempIndex] = row;
      return next;
    }
  }

  return [...prev, row];
}

/**
 * Mengelola daftar pesan untuk satu percakapan WhatsApp secara realtime.
 *
 * - Hanya berlangganan percakapan aktif dan berhenti berlangganan saat berganti
 *   (tidak ada listener ganda, tidak ada kebocoran memori).
 * - Mendukung pesan optimistik: tambahkan sementara, lalu direkonsiliasi oleh
 *   event INSERT/UPDATE realtime.
 */
export function useWhatsappConversationMessages({
  conversationId,
  enabled,
  initialMessages,
}: Params) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const conversationRef = useRef(conversationId);
  const initialRef = useRef(initialMessages);
  initialRef.current = initialMessages;

  // Seed ulang hanya saat percakapan benar-benar berganti, sehingga pesan yang
  // ditambahkan realtime tidak terhapus oleh render ulang induk.
  useEffect(() => {
    conversationRef.current = conversationId;
    setMessages(initialRef.current);
  }, [conversationId]);

  useEffect(() => {
    if (!enabled || !conversationId) {
      return;
    }

    const supabase = createClient();
    const filter = `conversation_id=eq.${conversationId}`;
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    const start = async () => {
      // Realtime mengevaluasi RLS dengan token pengguna. Tanpa ini, socket
      // berjalan sebagai anon dan event postgres_changes tidak pernah terkirim
      // meski status berstatus SUBSCRIBED.
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error(`${LOG} gagal mengambil sesi`, error);
      }
      const token = data.session?.access_token;
      console.log(`${LOG} mulai berlangganan`, {
        conversationId,
        hasToken: Boolean(token),
      });
      if (token) {
        supabase.realtime.setAuth(token);
      }

      if (cancelled) {
        return;
      }

      channel = supabase.channel(`wa-messages:${conversationId}`);

      channel
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "whatsapp_messages", filter },
          (payload) => {
            console.log(`${LOG} INSERT`, payload.new);
            const row = mapWhatsappRecordToMessageRow(payload.new);
            if (row) {
              setMessages((prev) => applyInsert(prev, row));
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "whatsapp_messages", filter },
          (payload) => {
            console.log(`${LOG} UPDATE`, payload.new);
            const row = mapWhatsappRecordToMessageRow(payload.new);
            if (row) {
              setMessages((prev) => applyUpdate(prev, row));
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "whatsapp_messages", filter },
          (payload) => {
            console.log(`${LOG} DELETE`, payload.old);
            const id =
              payload.old && typeof payload.old === "object"
                ? (payload.old as { id?: unknown }).id
                : null;
            if (typeof id === "string") {
              setMessages((prev) => prev.filter((message) => message.id !== id));
            }
          },
        )
        .subscribe((status, err) => {
          console.log(`${LOG} status`, status, conversationId);
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
  }, [conversationId, enabled]);

  const addOptimisticMessage = useCallback((text: string) => {
    const id = nextTempId();
    setMessages((prev) => [
      ...prev,
      {
        id,
        conversation_id: conversationRef.current,
        direction: "outgoing",
        external_message_id: null,
        message_text: text,
        attachments_json: [],
        sent_by_user_id: null,
        created_at: new Date().toISOString(),
        deliveryStatus: "pending",
      },
    ]);
    return id;
  }, []);

  const removeOptimisticMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((message) => message.id !== id));
  }, []);

  return { messages, addOptimisticMessage, removeOptimisticMessage };
}
