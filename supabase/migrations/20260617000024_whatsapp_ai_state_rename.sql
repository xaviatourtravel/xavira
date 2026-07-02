-- Align environments that applied ai_ownership column name from an earlier draft.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'whatsapp_conversations'
      AND column_name = 'ai_ownership'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'whatsapp_conversations'
      AND column_name = 'ai_state'
  ) THEN
    ALTER TABLE public.whatsapp_conversations
      RENAME COLUMN ai_ownership TO ai_state;
  END IF;
END $$;

ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS ai_last_action_at timestamptz;
