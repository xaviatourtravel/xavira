-- Content Board V1: media workspace workflow table

CREATE TABLE public.contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns (id) ON DELETE SET NULL,
  title text NOT NULL,
  platform text NOT NULL,
  content_type text NOT NULL,
  status text NOT NULL DEFAULT 'idea',
  caption text,
  cta text,
  drive_url text,
  assigned_to uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  publish_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contents_status_valid CHECK (
    status IN ('idea', 'draft', 'review', 'approved', 'scheduled', 'published')
  )
);

CREATE INDEX contents_organization_id_idx ON public.contents (organization_id);
CREATE INDEX contents_status_idx ON public.contents (organization_id, status);
CREATE INDEX contents_campaign_id_idx ON public.contents (campaign_id)
  WHERE campaign_id IS NOT NULL;
CREATE INDEX contents_assigned_to_idx ON public.contents (assigned_to)
  WHERE assigned_to IS NOT NULL;

CREATE TRIGGER contents_updated_at
  BEFORE UPDATE ON public.contents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.validate_content_board_org()
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

CREATE TRIGGER contents_validate_org
  BEFORE INSERT OR UPDATE ON public.contents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_content_board_org();

ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY contents_select_member
  ON public.contents
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY contents_insert_admin
  ON public.contents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY contents_update_admin
  ON public.contents
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

CREATE POLICY contents_delete_admin
  ON public.contents
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );
