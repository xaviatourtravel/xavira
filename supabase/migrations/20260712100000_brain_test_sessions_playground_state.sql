-- Playground active session persistence: conversation state, user scope, bounded updates.

ALTER TABLE public.brain_test_sessions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'saved'
    CHECK (status IN ('active', 'saved')),
  ADD COLUMN IF NOT EXISTS conversation_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS brain_test_sessions_active_user_idx
  ON public.brain_test_sessions (workspace_id, user_id, status)
  WHERE status = 'active';

COMMENT ON COLUMN public.brain_test_sessions.conversation_state IS
  'Bounded playground planner state: selectedEntity, collectedInformation, questionsAsked, greetingSent, handoffRequested, customerMemory, simulatedAttachments';
