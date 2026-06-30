-- Sprint 7.5: realtime messaging for WhatsApp.
--
-- Enable Supabase Realtime (Postgres logical replication) for the WhatsApp
-- inbox tables so the open conversation and the conversation list update
-- instantly without polling or page refresh.
--
-- REPLICA IDENTITY FULL ensures UPDATE and DELETE events carry enough of the
-- row for the client to reconcile status changes and apply the conversation_id
-- filter. RLS still governs which rows each user receives over realtime, via the
-- existing SELECT policies on these tables.

ALTER TABLE public.whatsapp_messages REPLICA IDENTITY FULL;
ALTER TABLE public.whatsapp_conversations REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'whatsapp_messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'whatsapp_conversations'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
    END IF;
  END IF;
END $$;
