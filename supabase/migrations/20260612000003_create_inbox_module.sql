-- Inbox Lite V1: social DM lead capture (Instagram / Facebook)
-- Architecture-ready for WhatsApp Cloud API, AI assistant, and auto-qualification.

CREATE TYPE public.inbox_source AS ENUM ('instagram', 'facebook');

CREATE TYPE public.inbox_status AS ENUM ('new', 'qualified', 'converted', 'closed');

CREATE TABLE public.inbox_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads (id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.campaigns (id) ON DELETE SET NULL,
  source public.inbox_source NOT NULL,
  contact_name text NOT NULL,
  contact_handle text,
  last_message text,
  last_message_at timestamptz,
  status public.inbox_status NOT NULL DEFAULT 'new',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inbox_conversations_contact_name_not_empty CHECK (length(trim(contact_name)) > 0)
);

CREATE INDEX inbox_conversations_organization_id_idx
  ON public.inbox_conversations (organization_id, updated_at DESC);

CREATE INDEX inbox_conversations_status_idx
  ON public.inbox_conversations (organization_id, status);

CREATE INDEX inbox_conversations_assigned_to_idx
  ON public.inbox_conversations (assigned_to)
  WHERE assigned_to IS NOT NULL;

CREATE INDEX inbox_conversations_lead_id_idx
  ON public.inbox_conversations (lead_id)
  WHERE lead_id IS NOT NULL;

CREATE TRIGGER inbox_conversations_set_updated_at
  BEFORE UPDATE ON public.inbox_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.validate_inbox_assigned_to_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = NEW.assigned_to
      AND p.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'assigned_to must belong to the same organization';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER inbox_conversations_validate_assigned_to
  BEFORE INSERT OR UPDATE OF assigned_to ON public.inbox_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_inbox_assigned_to_org();

CREATE OR REPLACE FUNCTION public.validate_inbox_campaign_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.campaign_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.campaigns c
    WHERE c.id = NEW.campaign_id
      AND c.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'campaign_id must belong to the same organization';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER inbox_conversations_validate_campaign
  BEFORE INSERT OR UPDATE OF campaign_id ON public.inbox_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_inbox_campaign_org();

CREATE OR REPLACE FUNCTION public.validate_inbox_lead_org()
RETURNS TRIGGER
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

CREATE TRIGGER inbox_conversations_validate_lead
  BEFORE INSERT OR UPDATE OF lead_id ON public.inbox_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_inbox_lead_org();

ALTER TABLE public.inbox_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY inbox_conversations_select_org_member
  ON public.inbox_conversations
  FOR SELECT
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND (
      public.is_org_admin_or_owner()
      OR assigned_to = auth.uid()
    )
  );

CREATE POLICY inbox_conversations_insert_admin_or_owner
  ON public.inbox_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY inbox_conversations_update_admin_or_owner
  ON public.inbox_conversations
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
