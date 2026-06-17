-- AI Content Studio: generation history + optional link to content board

CREATE TABLE public.ai_content_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  source_type text NOT NULL,
  package_id uuid REFERENCES public.packages (id) ON DELETE SET NULL,
  topic text,
  platform text,
  goal text,
  content_pillar text,
  content_angle text,
  additional_context text,
  generated_output jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_content_generations_source_type_valid CHECK (
    source_type IN ('package_based', 'free_topic')
  ),
  CONSTRAINT ai_content_generations_output_object CHECK (
    jsonb_typeof(generated_output) = 'object'
  )
);

CREATE INDEX ai_content_generations_organization_id_idx
  ON public.ai_content_generations (organization_id, created_at DESC);

CREATE INDEX ai_content_generations_package_id_idx
  ON public.ai_content_generations (package_id)
  WHERE package_id IS NOT NULL;

CREATE INDEX ai_content_generations_created_by_idx
  ON public.ai_content_generations (created_by)
  WHERE created_by IS NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_ai_content_generation_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.package_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.packages p
    WHERE p.id = NEW.package_id
      AND p.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'package_id must belong to the same organization';
  END IF;

  IF NEW.created_by IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = NEW.created_by
      AND p.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'created_by must belong to the same organization';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER ai_content_generations_validate_org
  BEFORE INSERT OR UPDATE ON public.ai_content_generations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ai_content_generation_org();

ALTER TABLE public.ai_content_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_content_generations_select_member
  ON public.ai_content_generations
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY ai_content_generations_insert_admin
  ON public.ai_content_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

ALTER TABLE public.contents
  ADD COLUMN IF NOT EXISTS ai_generation_id uuid
  REFERENCES public.ai_content_generations (id) ON DELETE SET NULL;

CREATE INDEX contents_ai_generation_id_idx
  ON public.contents (ai_generation_id)
  WHERE ai_generation_id IS NOT NULL;
