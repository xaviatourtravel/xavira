-- Conversation AI ownership + message sender attribution for WhatsApp inbox

ALTER TABLE public.whatsapp_conversations
  ADD COLUMN ai_state text NOT NULL DEFAULT 'AI_ACTIVE'
    CHECK (
      ai_state IN (
        'AI_ACTIVE',
        'READY_FOR_HUMAN',
        'HUMAN_ASSISTED',
        'HUMAN_ONLY'
      )
    ),
  ADD COLUMN ai_handoff_reason text,
  ADD COLUMN ai_last_action_at timestamptz;

ALTER TABLE public.whatsapp_messages
  ADD COLUMN sender_type text
    CHECK (
      sender_type IS NULL
      OR sender_type IN ('human', 'ai', 'customer')
    );

UPDATE public.whatsapp_messages
SET sender_type = 'customer'
WHERE direction = 'incoming'
  AND sender_type IS NULL;

UPDATE public.whatsapp_messages
SET sender_type = 'human'
WHERE direction = 'outgoing'
  AND sender_type IS NULL;

CREATE INDEX whatsapp_messages_conversation_human_outgoing_idx
  ON public.whatsapp_messages (conversation_id, timestamp DESC)
  WHERE direction = 'outgoing' AND sender_type = 'human';

CREATE INDEX whatsapp_messages_conversation_ai_outgoing_idx
  ON public.whatsapp_messages (conversation_id, timestamp DESC)
  WHERE direction = 'outgoing' AND sender_type = 'ai';
