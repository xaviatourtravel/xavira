-- WhatsApp conversation workspace fields (shared Communication Workspace sidebar)

ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS status public.omnichannel_conversation_status NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS whatsapp_conversations_assigned_user_idx
  ON public.whatsapp_conversations (assigned_user_id)
  WHERE assigned_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS whatsapp_conversations_workspace_status_idx
  ON public.whatsapp_conversations (workspace_id, status);

CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations (id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_conversation_notes_note_not_empty CHECK (length(trim(note)) > 0)
);

CREATE INDEX IF NOT EXISTS whatsapp_conversation_notes_conversation_created_idx
  ON public.whatsapp_conversation_notes (conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations (id) ON DELETE CASCADE,
  tag text NOT NULL,
  CONSTRAINT whatsapp_conversation_tags_tag_not_empty CHECK (length(trim(tag)) > 0),
  CONSTRAINT whatsapp_conversation_tags_unique UNIQUE (conversation_id, tag)
);

CREATE INDEX IF NOT EXISTS whatsapp_conversation_tags_conversation_idx
  ON public.whatsapp_conversation_tags (conversation_id);

CREATE OR REPLACE FUNCTION public.validate_whatsapp_assigned_user_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.assigned_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = NEW.assigned_user_id
      AND p.organization_id = NEW.workspace_id
  ) THEN
    RAISE EXCEPTION 'assigned_user_id must belong to the same workspace';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS whatsapp_conversations_validate_assigned_user ON public.whatsapp_conversations;

CREATE TRIGGER whatsapp_conversations_validate_assigned_user
  BEFORE INSERT OR UPDATE OF assigned_user_id ON public.whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_whatsapp_assigned_user_org();

CREATE OR REPLACE FUNCTION public.validate_whatsapp_note_created_by_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  conv_workspace uuid;
BEGIN
  SELECT workspace_id INTO conv_workspace
  FROM public.whatsapp_conversations
  WHERE id = NEW.conversation_id;

  IF conv_workspace IS NULL THEN
    RAISE EXCEPTION 'conversation_id does not exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = NEW.created_by
      AND p.organization_id = conv_workspace
  ) THEN
    RAISE EXCEPTION 'created_by must belong to the same workspace as the conversation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS whatsapp_conversation_notes_validate_created_by ON public.whatsapp_conversation_notes;

CREATE TRIGGER whatsapp_conversation_notes_validate_created_by
  BEFORE INSERT OR UPDATE OF created_by, conversation_id ON public.whatsapp_conversation_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_whatsapp_note_created_by_org();

ALTER TABLE public.whatsapp_conversation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversation_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY whatsapp_conversation_notes_select_member
  ON public.whatsapp_conversation_notes
  FOR SELECT
  TO authenticated
  USING (public.can_access_whatsapp_conversation(conversation_id));

CREATE POLICY whatsapp_conversation_notes_insert_member
  ON public.whatsapp_conversation_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_access_whatsapp_conversation(conversation_id)
    AND created_by = auth.uid()
  );

CREATE POLICY whatsapp_conversation_tags_select_member
  ON public.whatsapp_conversation_tags
  FOR SELECT
  TO authenticated
  USING (public.can_access_whatsapp_conversation(conversation_id));

CREATE POLICY whatsapp_conversation_tags_insert_admin
  ON public.whatsapp_conversation_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_access_whatsapp_conversation(conversation_id)
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY whatsapp_conversation_tags_delete_admin
  ON public.whatsapp_conversation_tags
  FOR DELETE
  TO authenticated
  USING (
    public.can_access_whatsapp_conversation(conversation_id)
    AND public.is_org_admin_or_owner()
  );
