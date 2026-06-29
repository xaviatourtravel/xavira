-- Store WhatsApp pushName for contact display in inbox
ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS contact_name text;

CREATE INDEX IF NOT EXISTS whatsapp_conversations_contact_name_idx
  ON public.whatsapp_conversations (workspace_id, contact_name)
  WHERE contact_name IS NOT NULL;
