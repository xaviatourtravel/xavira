-- Conversation memory for WhatsApp AI (persistent customer facts per chat)

CREATE TABLE public.conversation_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations (id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.leads (id) ON DELETE SET NULL,
  memory_key text NOT NULL,
  memory_value text NOT NULL,
  confidence numeric(4, 3) NOT NULL DEFAULT 0.850 CHECK (confidence >= 0 AND confidence <= 1),
  source text NOT NULL DEFAULT 'customer_message',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversation_memory_unique_key UNIQUE (conversation_id, memory_key)
);

CREATE INDEX conversation_memory_conversation_idx
  ON public.conversation_memory (conversation_id);

CREATE INDEX conversation_memory_workspace_idx
  ON public.conversation_memory (workspace_id);

CREATE TRIGGER conversation_memory_updated_at
  BEFORE UPDATE ON public.conversation_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.conversation_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversation_memory_select_member
  ON public.conversation_memory
  FOR SELECT
  TO authenticated
  USING (workspace_id = public.get_my_organization_id());

-- Memory observability event types

ALTER TABLE public.ai_events
  DROP CONSTRAINT IF EXISTS ai_events_event_type_check;

ALTER TABLE public.ai_events
  ADD CONSTRAINT ai_events_event_type_check
  CHECK (
    event_type IN (
      'AI_INTENT_CLASSIFIED',
      'AI_REPLY_SENT',
      'AI_HANDOFF_TRIGGERED',
      'AI_SKIPPED',
      'AI_STATE_CHANGED',
      'AI_LLM_REPLY_STARTED',
      'AI_LLM_REPLY_SENT',
      'AI_LLM_HANDOFF',
      'AI_LLM_FAILED',
      'AI_LLM_SKIPPED',
      'AI_DOCUMENT_SEND_ATTEMPTED',
      'AI_DOCUMENT_SENT',
      'AI_DOCUMENT_FAILED',
      'AI_DOCUMENT_SKIPPED',
      'AI_VALIDATION_PASSED',
      'AI_VALIDATION_FAILED',
      'AI_RESPONSE_SANITIZED',
      'AI_REPLY_QUALITY_CHANGED',
      'AI_REPLY_QUALITY_PASSED',
      'CONTEXT_RETRIEVED',
      'MEMORY_CREATED',
      'MEMORY_UPDATED',
      'MEMORY_USED'
    )
  );
