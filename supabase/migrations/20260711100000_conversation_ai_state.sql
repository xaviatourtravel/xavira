-- Persistent structured conversation state for WhatsApp AI (AI-003)

CREATE TABLE public.conversation_ai_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations (id) ON DELETE CASCADE,
  greeting_sent boolean NOT NULL DEFAULT false,
  business_introduction_sent boolean NOT NULL DEFAULT false,
  customer_name text,
  current_intent text,
  current_phase text NOT NULL DEFAULT 'NEW',
  qualification_stage text,
  collected_information jsonb NOT NULL DEFAULT '{}'::jsonb,
  questions_asked jsonb NOT NULL DEFAULT '[]'::jsonb,
  handoff_requested boolean NOT NULL DEFAULT false,
  handoff_reason text,
  handoff_at timestamptz,
  ai_paused boolean NOT NULL DEFAULT false,
  last_ai_reply_at timestamptz,
  last_customer_message_at timestamptz,
  last_state_transition_at timestamptz NOT NULL DEFAULT now(),
  state_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversation_ai_state_unique UNIQUE (workspace_id, conversation_id),
  CONSTRAINT conversation_ai_state_phase_check CHECK (
    current_phase IN (
      'NEW',
      'ENGAGED',
      'QUALIFYING',
      'READY_FOR_HANDOFF',
      'HANDED_OFF',
      'HUMAN_ACTIVE',
      'AI_PAUSED',
      'CLOSED'
    )
  ),
  CONSTRAINT conversation_ai_state_collected_information_object CHECK (
    jsonb_typeof(collected_information) = 'object'
  ),
  CONSTRAINT conversation_ai_state_questions_asked_array CHECK (
    jsonb_typeof(questions_asked) = 'array'
  )
);

CREATE INDEX conversation_ai_state_conversation_idx
  ON public.conversation_ai_state (conversation_id);

CREATE INDEX conversation_ai_state_workspace_idx
  ON public.conversation_ai_state (workspace_id);

CREATE TRIGGER conversation_ai_state_updated_at
  BEFORE UPDATE ON public.conversation_ai_state
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.conversation_ai_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversation_ai_state_select_member
  ON public.conversation_ai_state
  FOR SELECT
  TO authenticated
  USING (workspace_id = public.get_my_organization_id());

-- Writes are performed by server-side WhatsApp AI pipeline (service role), mirroring conversation_memory.
