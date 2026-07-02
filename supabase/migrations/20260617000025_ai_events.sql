-- AI pipeline event log for WhatsApp auto-reply (LLM-ready observability)

CREATE TABLE public.ai_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations (id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.whatsapp_messages (id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (
    event_type IN (
      'AI_INTENT_CLASSIFIED',
      'AI_REPLY_SENT',
      'AI_HANDOFF_TRIGGERED',
      'AI_SKIPPED',
      'AI_STATE_CHANGED'
    )
  ),
  intent text,
  confidence numeric(4, 3),
  previous_state text,
  next_state text,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_events_workspace_created_idx
  ON public.ai_events (workspace_id, created_at DESC);

CREATE INDEX ai_events_conversation_created_idx
  ON public.ai_events (conversation_id, created_at DESC);

ALTER TABLE public.ai_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_events_select_member
  ON public.ai_events
  FOR SELECT
  TO authenticated
  USING (workspace_id = public.get_my_organization_id());

CREATE POLICY ai_events_insert_member
  ON public.ai_events
  FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id = public.get_my_organization_id());
