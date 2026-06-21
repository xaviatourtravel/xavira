-- Link omnichannel conversations to CRM leads for inbox conversion workflow.

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conversations_lead_id_idx
  ON public.conversations (lead_id)
  WHERE lead_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_conversation_lead_org()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.leads l
    WHERE l.id = NEW.lead_id
      AND l.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'lead_id must belong to the same organization';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conversations_validate_lead_org ON public.conversations;

CREATE TRIGGER conversations_validate_lead_org
  BEFORE INSERT OR UPDATE OF lead_id ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_conversation_lead_org();
