-- WhatsApp inbox store (Evolution API incoming pipeline)

CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  instance_name text NOT NULL,
  phone_number text NOT NULL,
  customer_id uuid REFERENCES public.leads (id) ON DELETE SET NULL,
  last_message text,
  last_message_at timestamptz,
  unread_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_conversations_unread_count_non_negative CHECK (unread_count >= 0),
  CONSTRAINT whatsapp_conversations_unique_phone
    UNIQUE (workspace_id, instance_name, phone_number)
);

CREATE INDEX whatsapp_conversations_workspace_last_message_idx
  ON public.whatsapp_conversations (workspace_id, last_message_at DESC NULLS LAST);

CREATE INDEX whatsapp_conversations_customer_idx
  ON public.whatsapp_conversations (customer_id)
  WHERE customer_id IS NOT NULL;

CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations (id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  message_type text NOT NULL DEFAULT 'text',
  text text,
  media_url text,
  status text,
  timestamp timestamptz NOT NULL,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  external_message_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX whatsapp_messages_external_unique
  ON public.whatsapp_messages (conversation_id, external_message_id)
  WHERE external_message_id IS NOT NULL;

CREATE INDEX whatsapp_messages_conversation_timestamp_idx
  ON public.whatsapp_messages (conversation_id, timestamp ASC);

CREATE TRIGGER whatsapp_conversations_set_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.sync_whatsapp_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.whatsapp_conversations
  SET
    last_message = COALESCE(NEW.text, '[Media]'),
    last_message_at = NEW.timestamp,
    unread_count = CASE
      WHEN NEW.direction = 'incoming' THEN unread_count + 1
      ELSE unread_count
    END,
    updated_at = now()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER whatsapp_messages_sync_conversation
  AFTER INSERT ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_whatsapp_conversation_on_message();

CREATE OR REPLACE FUNCTION public.can_access_whatsapp_conversation(conv_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.whatsapp_conversations c
    WHERE c.id = conv_id
      AND c.workspace_id = public.get_my_organization_id()
  );
$$;

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY whatsapp_conversations_select_member
  ON public.whatsapp_conversations
  FOR SELECT
  TO authenticated
  USING (workspace_id = public.get_my_organization_id());

CREATE POLICY whatsapp_conversations_update_member
  ON public.whatsapp_conversations
  FOR UPDATE
  TO authenticated
  USING (workspace_id = public.get_my_organization_id())
  WITH CHECK (workspace_id = public.get_my_organization_id());

CREATE POLICY whatsapp_messages_select_member
  ON public.whatsapp_messages
  FOR SELECT
  TO authenticated
  USING (public.can_access_whatsapp_conversation(conversation_id));
