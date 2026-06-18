-- Omnichannel Inbox Foundation (Phase 1)
-- Instagram DM, Facebook Messenger, WhatsApp — organization-scoped conversation store.

CREATE TYPE public.omnichannel_channel AS ENUM ('instagram', 'facebook', 'whatsapp');

CREATE TYPE public.omnichannel_conversation_status AS ENUM (
  'new',
  'interested',
  'hot_lead',
  'booking_process',
  'paid',
  'lost'
);

CREATE TYPE public.omnichannel_message_direction AS ENUM ('incoming', 'outgoing');

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  channel public.omnichannel_channel NOT NULL,
  external_conversation_id text NOT NULL,
  external_user_id text,
  customer_name text,
  customer_username text,
  customer_avatar text,
  assigned_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  status public.omnichannel_conversation_status NOT NULL DEFAULT 'new',
  unread_count integer NOT NULL DEFAULT 0,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_external_unique
    UNIQUE (organization_id, channel, external_conversation_id),
  CONSTRAINT conversations_unread_count_non_negative CHECK (unread_count >= 0)
);

CREATE INDEX conversations_organization_last_message_idx
  ON public.conversations (organization_id, last_message_at DESC NULLS LAST);

CREATE INDEX conversations_organization_status_idx
  ON public.conversations (organization_id, status);

CREATE INDEX conversations_assigned_user_idx
  ON public.conversations (assigned_user_id)
  WHERE assigned_user_id IS NOT NULL;

CREATE INDEX conversations_channel_idx
  ON public.conversations (organization_id, channel);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  direction public.omnichannel_message_direction NOT NULL,
  external_message_id text,
  message_text text,
  attachments_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  sent_by_user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX messages_conversation_external_message_unique
  ON public.messages (conversation_id, external_message_id)
  WHERE external_message_id IS NOT NULL;

CREATE INDEX messages_conversation_created_idx
  ON public.messages (conversation_id, created_at ASC);

CREATE TABLE public.conversation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversation_notes_note_not_empty CHECK (length(trim(note)) > 0)
);

CREATE INDEX conversation_notes_conversation_created_idx
  ON public.conversation_notes (conversation_id, created_at DESC);

CREATE TABLE public.conversation_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  tag text NOT NULL,
  CONSTRAINT conversation_tags_tag_not_empty CHECK (length(trim(tag)) > 0),
  CONSTRAINT conversation_tags_unique UNIQUE (conversation_id, tag)
);

CREATE INDEX conversation_tags_conversation_idx
  ON public.conversation_tags (conversation_id);

CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.validate_omnichannel_assigned_user_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.assigned_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = NEW.assigned_user_id
      AND p.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'assigned_user_id must belong to the same organization';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER conversations_validate_assigned_user
  BEFORE INSERT OR UPDATE OF assigned_user_id ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_omnichannel_assigned_user_org();

CREATE OR REPLACE FUNCTION public.validate_conversation_note_created_by_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  conv_org uuid;
BEGIN
  SELECT organization_id INTO conv_org
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  IF conv_org IS NULL THEN
    RAISE EXCEPTION 'conversation_id does not exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = NEW.created_by
      AND p.organization_id = conv_org
  ) THEN
    RAISE EXCEPTION 'created_by must belong to the same organization as the conversation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER conversation_notes_validate_created_by
  BEFORE INSERT OR UPDATE OF created_by, conversation_id ON public.conversation_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_conversation_note_created_by_org();

CREATE OR REPLACE FUNCTION public.validate_message_sent_by_user_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  conv_org uuid;
BEGIN
  IF NEW.sent_by_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT organization_id INTO conv_org
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  IF conv_org IS NULL THEN
    RAISE EXCEPTION 'conversation_id does not exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = NEW.sent_by_user_id
      AND p.organization_id = conv_org
  ) THEN
    RAISE EXCEPTION 'sent_by_user_id must belong to the same organization as the conversation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_validate_sent_by_user
  BEFORE INSERT OR UPDATE OF sent_by_user_id, conversation_id ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_message_sent_by_user_org();

CREATE OR REPLACE FUNCTION public.sync_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at = NEW.created_at,
    unread_count = CASE
      WHEN NEW.direction = 'incoming' THEN unread_count + 1
      ELSE unread_count
    END,
    updated_at = now()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_sync_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_conversation_on_message();

CREATE OR REPLACE FUNCTION public.can_access_omnichannel_conversation(conv_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = conv_id
      AND c.organization_id = public.get_my_organization_id()
      AND (
        public.is_org_admin_or_owner()
        OR c.assigned_user_id = auth.uid()
      )
  );
$$;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversations_select_member
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND (
      public.is_org_admin_or_owner()
      OR assigned_user_id = auth.uid()
    )
  );

CREATE POLICY conversations_insert_admin
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY conversations_update_admin
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  )
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY conversations_delete_admin
  ON public.conversations
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY messages_select_member
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (public.can_access_omnichannel_conversation(conversation_id));

CREATE POLICY messages_insert_member
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_omnichannel_conversation(conversation_id));

CREATE POLICY conversation_notes_select_member
  ON public.conversation_notes
  FOR SELECT
  TO authenticated
  USING (public.can_access_omnichannel_conversation(conversation_id));

CREATE POLICY conversation_notes_insert_member
  ON public.conversation_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_access_omnichannel_conversation(conversation_id)
    AND created_by = auth.uid()
  );

CREATE POLICY conversation_tags_select_member
  ON public.conversation_tags
  FOR SELECT
  TO authenticated
  USING (public.can_access_omnichannel_conversation(conversation_id));

CREATE POLICY conversation_tags_insert_admin
  ON public.conversation_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_access_omnichannel_conversation(conversation_id)
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY conversation_tags_delete_admin
  ON public.conversation_tags
  FOR DELETE
  TO authenticated
  USING (
    public.can_access_omnichannel_conversation(conversation_id)
    AND public.is_org_admin_or_owner()
  );
