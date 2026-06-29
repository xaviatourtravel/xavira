-- Sprint 7: Communication Workspace production statuses, labels, assignment history

CREATE TYPE public.workspace_conversation_status_new AS ENUM (
  'new',
  'following_up',
  'quotation_sent',
  'waiting_dp',
  'closed_won',
  'closed_lost'
);

ALTER TABLE public.conversations
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.conversations
  ALTER COLUMN status TYPE public.workspace_conversation_status_new
  USING (
    CASE status::text
      WHEN 'new' THEN 'new'::public.workspace_conversation_status_new
      WHEN 'interested' THEN 'following_up'::public.workspace_conversation_status_new
      WHEN 'hot_lead' THEN 'following_up'::public.workspace_conversation_status_new
      WHEN 'booking_process' THEN 'waiting_dp'::public.workspace_conversation_status_new
      WHEN 'paid' THEN 'closed_won'::public.workspace_conversation_status_new
      WHEN 'lost' THEN 'closed_lost'::public.workspace_conversation_status_new
      ELSE 'new'::public.workspace_conversation_status_new
    END
  );

ALTER TABLE public.conversations
  ALTER COLUMN status SET DEFAULT 'new'::public.workspace_conversation_status_new;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'whatsapp_conversations'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.whatsapp_conversations
      ALTER COLUMN status DROP DEFAULT;

    ALTER TABLE public.whatsapp_conversations
      ALTER COLUMN status TYPE public.workspace_conversation_status_new
      USING (
        CASE status::text
          WHEN 'new' THEN 'new'::public.workspace_conversation_status_new
          WHEN 'interested' THEN 'following_up'::public.workspace_conversation_status_new
          WHEN 'hot_lead' THEN 'following_up'::public.workspace_conversation_status_new
          WHEN 'booking_process' THEN 'waiting_dp'::public.workspace_conversation_status_new
          WHEN 'paid' THEN 'closed_won'::public.workspace_conversation_status_new
          WHEN 'lost' THEN 'closed_lost'::public.workspace_conversation_status_new
          ELSE 'new'::public.workspace_conversation_status_new
        END
      );

    ALTER TABLE public.whatsapp_conversations
      ALTER COLUMN status SET DEFAULT 'new'::public.workspace_conversation_status_new;
  END IF;
END $$;

DROP TYPE public.omnichannel_conversation_status;

ALTER TYPE public.workspace_conversation_status_new
  RENAME TO omnichannel_conversation_status;

ALTER TABLE public.conversation_tags
  ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#64748b';

ALTER TABLE public.whatsapp_conversation_tags
  ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#64748b';

CREATE TABLE IF NOT EXISTS public.workspace_assignment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  conversation_channel text NOT NULL,
  conversation_id uuid NOT NULL,
  assigned_from uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  assigned_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workspace_assignment_events_channel_not_empty
    CHECK (length(trim(conversation_channel)) > 0)
);

CREATE INDEX IF NOT EXISTS workspace_assignment_events_conversation_idx
  ON public.workspace_assignment_events (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS workspace_assignment_events_org_idx
  ON public.workspace_assignment_events (organization_id, created_at DESC);

ALTER TABLE public.workspace_assignment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_assignment_events_select_member
  ON public.workspace_assignment_events;
DROP POLICY IF EXISTS workspace_assignment_events_insert_member
  ON public.workspace_assignment_events;

CREATE POLICY workspace_assignment_events_select_member
  ON public.workspace_assignment_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = workspace_assignment_events.organization_id
    )
  );

CREATE POLICY workspace_assignment_events_insert_member
  ON public.workspace_assignment_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.organization_id = workspace_assignment_events.organization_id
    )
    AND assigned_by = auth.uid()
  );

DROP POLICY IF EXISTS whatsapp_conversation_tags_insert_admin ON public.whatsapp_conversation_tags;
DROP POLICY IF EXISTS whatsapp_conversation_tags_delete_admin ON public.whatsapp_conversation_tags;
DROP POLICY IF EXISTS whatsapp_conversation_tags_insert_member ON public.whatsapp_conversation_tags;
DROP POLICY IF EXISTS whatsapp_conversation_tags_delete_member ON public.whatsapp_conversation_tags;

CREATE POLICY whatsapp_conversation_tags_insert_member
  ON public.whatsapp_conversation_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_whatsapp_conversation(conversation_id));

CREATE POLICY whatsapp_conversation_tags_delete_member
  ON public.whatsapp_conversation_tags
  FOR DELETE
  TO authenticated
  USING (public.can_access_whatsapp_conversation(conversation_id));
