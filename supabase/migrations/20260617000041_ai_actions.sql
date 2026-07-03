-- AI Action Engine: durable log of recommended / validated / executed actions.
-- LLM only recommends; Action Engine is the only path for side effects.

CREATE TABLE public.ai_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations (id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (
    action_type IN (
      'SEND_DOCUMENT',
      'HANDOVER',
      'CREATE_LEAD_NOTE',
      'UPDATE_MEMORY',
      'UPDATE_LEAD_PROGRESS',
      'SUGGEST_PACKAGE',
      'ASK_QUALIFICATION',
      'NO_ACTION'
    )
  ),
  status text NOT NULL DEFAULT 'PENDING' CHECK (
    status IN (
      'PENDING',
      'APPROVED',
      'REJECTED',
      'EXECUTED',
      'FAILED'
    )
  ),
  confidence numeric(5, 4) NOT NULL DEFAULT 0,
  reason text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  executed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_actions_workspace_created_idx
  ON public.ai_actions (workspace_id, created_at DESC);

CREATE INDEX ai_actions_conversation_created_idx
  ON public.ai_actions (conversation_id, created_at DESC);

CREATE INDEX ai_actions_status_idx
  ON public.ai_actions (workspace_id, status, created_at DESC);

ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_actions_select_member
  ON public.ai_actions
  FOR SELECT
  TO authenticated
  USING (workspace_id = public.get_my_organization_id());

CREATE POLICY ai_actions_insert_member
  ON public.ai_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id = public.get_my_organization_id());

CREATE POLICY ai_actions_update_member
  ON public.ai_actions
  FOR UPDATE
  TO authenticated
  USING (workspace_id = public.get_my_organization_id())
  WITH CHECK (workspace_id = public.get_my_organization_id());
