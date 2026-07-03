-- Lead qualification progress derived from conversation memory

CREATE TABLE public.lead_qualification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations (id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.leads (id) ON DELETE SET NULL,
  destination text,
  departure_month text,
  departure_date text,
  passenger_count text,
  budget text,
  trip_type text,
  special_request text,
  completion_score integer NOT NULL DEFAULT 0 CHECK (completion_score >= 0 AND completion_score <= 100),
  qualification_status text NOT NULL DEFAULT 'NEW' CHECK (
    qualification_status IN ('NEW', 'QUALIFYING', 'QUALIFIED', 'HANDOVER_READY', 'CLOSED')
  ),
  last_ai_question text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_qualification_conversation_unique UNIQUE (conversation_id)
);

CREATE INDEX lead_qualification_workspace_idx
  ON public.lead_qualification (workspace_id);

CREATE INDEX lead_qualification_status_idx
  ON public.lead_qualification (workspace_id, qualification_status);

CREATE TRIGGER lead_qualification_updated_at
  BEFORE UPDATE ON public.lead_qualification
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.lead_qualification ENABLE ROW LEVEL SECURITY;

CREATE POLICY lead_qualification_select_member
  ON public.lead_qualification
  FOR SELECT
  TO authenticated
  USING (workspace_id = public.get_my_organization_id());

-- Lead qualification observability event type

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
      'MEMORY_USED',
      'MEMORY_EXTRACTION_STARTED',
      'MEMORY_EXTRACTION_COMPLETED',
      'MEMORY_EXTRACTION_SKIPPED',
      'LEAD_QUALIFICATION_UPDATED'
    )
  );
