-- Business Brain: organization-scoped brain record + Company DNA draft storage.

CREATE TABLE public.business_brains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX business_brains_organization_id_idx
  ON public.business_brains (organization_id);

CREATE TRIGGER business_brains_updated_at
  BEFORE UPDATE ON public.business_brains
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.company_dna (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_brain_id uuid NOT NULL UNIQUE REFERENCES public.business_brains (id) ON DELETE CASCADE,
  company_name text NOT NULL DEFAULT '',
  industry text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  about text NOT NULL DEFAULT '',
  brand_personality jsonb NOT NULL DEFAULT '[]'::jsonb,
  communication_style jsonb NOT NULL DEFAULT '{}'::jsonb,
  sales_style text NOT NULL DEFAULT 'consultative',
  ai_goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  never_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_dna_brand_personality_is_array
    CHECK (jsonb_typeof(brand_personality) = 'array'),
  CONSTRAINT company_dna_communication_style_is_object
    CHECK (jsonb_typeof(communication_style) = 'object'),
  CONSTRAINT company_dna_ai_goals_is_array
    CHECK (jsonb_typeof(ai_goals) = 'array'),
  CONSTRAINT company_dna_never_rules_is_array
    CHECK (jsonb_typeof(never_rules) = 'array'),
  CONSTRAINT company_dna_sales_style_valid
    CHECK (
      sales_style IN (
        'educate_first',
        'consultative',
        'hard_sell',
        'relationship_based'
      )
    )
);

CREATE INDEX company_dna_business_brain_id_idx
  ON public.company_dna (business_brain_id);

CREATE TRIGGER company_dna_updated_at
  BEFORE UPDATE ON public.company_dna
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.business_brains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_dna ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_brains_select_member
  ON public.business_brains
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY business_brains_insert_admin
  ON public.business_brains
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY business_brains_update_admin
  ON public.business_brains
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

CREATE POLICY company_dna_select_member
  ON public.company_dna
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = company_dna.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY company_dna_insert_admin
  ON public.company_dna
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = company_dna.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY company_dna_update_admin
  ON public.company_dna
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = company_dna.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = company_dna.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );
