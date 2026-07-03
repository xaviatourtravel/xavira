-- Business Brain publish workflow: version snapshots + publish metadata.

ALTER TABLE public.business_brains
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS draft_updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.business_brains
  ADD CONSTRAINT business_brains_status_valid
    CHECK (status IN ('draft', 'published'));

CREATE TABLE public.brain_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_brain_id uuid NOT NULL REFERENCES public.business_brains (id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'published',
  published_at timestamptz NOT NULL DEFAULT now(),
  published_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brain_versions_snapshot_is_object
    CHECK (jsonb_typeof(snapshot) = 'object'),
  CONSTRAINT brain_versions_status_valid
    CHECK (status IN ('published', 'superseded')),
  CONSTRAINT brain_versions_version_positive
    CHECK (version_number > 0),
  CONSTRAINT brain_versions_unique_number
    UNIQUE (business_brain_id, version_number)
);

ALTER TABLE public.business_brains
  ADD COLUMN IF NOT EXISTS published_version_id uuid REFERENCES public.brain_versions (id) ON DELETE SET NULL;

CREATE INDEX brain_versions_business_brain_id_idx
  ON public.brain_versions (business_brain_id);

CREATE INDEX brain_versions_published_at_idx
  ON public.brain_versions (published_at DESC);

CREATE INDEX business_brains_published_version_id_idx
  ON public.business_brains (published_version_id);

ALTER TABLE public.brain_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY brain_versions_select_member
  ON public.brain_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_versions.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY brain_versions_insert_admin
  ON public.brain_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_versions.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_versions_update_admin
  ON public.brain_versions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_versions.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_versions.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );
