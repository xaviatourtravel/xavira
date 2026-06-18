-- Instagram Analytics V1: account stats, per-media insights, content board link.

CREATE TABLE public.instagram_account_stats (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations (id) ON DELETE CASCADE,
  instagram_business_account_id text NOT NULL,
  username text,
  followers_count integer NOT NULL DEFAULT 0,
  last_synced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.instagram_media_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  instagram_media_id text NOT NULL,
  media_type text,
  permalink text,
  caption text,
  posted_at timestamptz,
  reach integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  content_pillar text,
  content_id uuid REFERENCES public.contents (id) ON DELETE SET NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT instagram_media_insights_org_media_unique
    UNIQUE (organization_id, instagram_media_id)
);

CREATE INDEX instagram_media_insights_org_posted_idx
  ON public.instagram_media_insights (organization_id, posted_at DESC);

CREATE INDEX instagram_media_insights_org_pillar_idx
  ON public.instagram_media_insights (organization_id, content_pillar);

ALTER TABLE public.contents
  ADD COLUMN IF NOT EXISTS instagram_media_id text;

CREATE TRIGGER instagram_account_stats_updated_at
  BEFORE UPDATE ON public.instagram_account_stats
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER instagram_media_insights_updated_at
  BEFORE UPDATE ON public.instagram_media_insights
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.instagram_account_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_media_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY instagram_account_stats_select_member
  ON public.instagram_account_stats
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY instagram_account_stats_insert_admin
  ON public.instagram_account_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY instagram_account_stats_update_admin
  ON public.instagram_account_stats
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

CREATE POLICY instagram_media_insights_select_member
  ON public.instagram_media_insights
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY instagram_media_insights_insert_admin
  ON public.instagram_media_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY instagram_media_insights_update_admin
  ON public.instagram_media_insights
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

CREATE POLICY instagram_media_insights_delete_admin
  ON public.instagram_media_insights
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );
