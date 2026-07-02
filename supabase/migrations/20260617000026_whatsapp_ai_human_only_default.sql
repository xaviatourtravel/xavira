-- Safety: WhatsApp AI auto-reply is opt-in per conversation (HUMAN_ONLY by default).

ALTER TABLE public.whatsapp_conversations
  ALTER COLUMN ai_state SET DEFAULT 'HUMAN_ONLY';

UPDATE public.whatsapp_conversations
SET
  ai_state = 'HUMAN_ONLY',
  ai_handoff_reason = NULL
WHERE ai_state IS NULL
   OR ai_state = 'AI_ACTIVE';
