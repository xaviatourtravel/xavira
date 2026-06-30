-- Sprint 7 / Epic 1: outgoing WhatsApp replies are written through the
-- authenticated (RLS-governed) Supabase client. The whatsapp_messages table had
-- RLS enabled but only a SELECT policy, so INSERT (and the follow-up status
-- UPDATE) were default-denied with "new row violates row-level security policy".
--
-- Incoming messages keep working because the webhook uses the service-role
-- admin client, which bypasses RLS.
--
-- These policies are tenant-scoped (NOT permissive): they reuse the same
-- org-isolation check as the existing SELECT policy and the sibling
-- whatsapp_conversation_notes / whatsapp_conversation_tags tables. RLS stays
-- enabled. Per-row business rules (assignment / reply permission) are enforced
-- in the application layer before the write.

DROP POLICY IF EXISTS whatsapp_messages_insert_member
  ON public.whatsapp_messages;
DROP POLICY IF EXISTS whatsapp_messages_update_member
  ON public.whatsapp_messages;

CREATE POLICY whatsapp_messages_insert_member
  ON public.whatsapp_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_whatsapp_conversation(conversation_id));

CREATE POLICY whatsapp_messages_update_member
  ON public.whatsapp_messages
  FOR UPDATE
  TO authenticated
  USING (public.can_access_whatsapp_conversation(conversation_id))
  WITH CHECK (public.can_access_whatsapp_conversation(conversation_id));
