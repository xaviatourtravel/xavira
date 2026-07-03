-- Enable realtime for AI Action Engine panel in Inbox Command Center.

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
        AND tablename = 'ai_actions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_actions;
    END IF;
  END IF;
END $$;
