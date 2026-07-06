-- Business Brain: saved AI simulator test sessions per workspace.

CREATE TABLE public.brain_test_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  title text NOT NULL,
  scenario text,
  conversation jsonb NOT NULL DEFAULT '[]'::jsonb,
  inspector jsonb NOT NULL DEFAULT '{}'::jsonb,
  score numeric(5, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brain_test_sessions_title_not_blank CHECK (char_length(trim(title)) > 0),
  CONSTRAINT brain_test_sessions_conversation_is_array
    CHECK (jsonb_typeof(conversation) = 'array'),
  CONSTRAINT brain_test_sessions_inspector_is_object
    CHECK (jsonb_typeof(inspector) = 'object'),
  CONSTRAINT brain_test_sessions_score_range
    CHECK (score >= 0 AND score <= 100)
);

CREATE INDEX brain_test_sessions_workspace_created_idx
  ON public.brain_test_sessions (workspace_id, created_at DESC);

ALTER TABLE public.brain_test_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY brain_test_sessions_select_member
  ON public.brain_test_sessions
  FOR SELECT
  TO authenticated
  USING (workspace_id = public.get_my_organization_id());

CREATE POLICY brain_test_sessions_insert_member
  ON public.brain_test_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id = public.get_my_organization_id());

CREATE POLICY brain_test_sessions_update_member
  ON public.brain_test_sessions
  FOR UPDATE
  TO authenticated
  USING (workspace_id = public.get_my_organization_id())
  WITH CHECK (workspace_id = public.get_my_organization_id());

CREATE POLICY brain_test_sessions_delete_member
  ON public.brain_test_sessions
  FOR DELETE
  TO authenticated
  USING (workspace_id = public.get_my_organization_id());
