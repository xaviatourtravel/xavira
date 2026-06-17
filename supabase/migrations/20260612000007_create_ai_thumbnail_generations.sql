-- AI Thumbnail Studio: generation history + optional content board attachment

ALTER TYPE public.ai_feature ADD VALUE IF NOT EXISTS 'thumbnail';

CREATE TABLE public.ai_thumbnail_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ai_content_generation_id uuid REFERENCES public.ai_content_generations (id) ON DELETE SET NULL,
  source_hook text NOT NULL,
  source_vo_script text NOT NULL,
  content_pillar text NOT NULL,
  content_angle text NOT NULL,
  custom_headline text,
  cover_format text NOT NULL DEFAULT 'instagram_reels',
  style_preset text NOT NULL DEFAULT 'premium_travel',
  headlines jsonb NOT NULL DEFAULT '[]'::jsonb,
  concept jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_variations jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_headline text,
  selected_image_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_thumbnail_generations_cover_format_valid CHECK (
    cover_format IN ('instagram_reels', 'tiktok')
  ),
  CONSTRAINT ai_thumbnail_generations_style_preset_valid CHECK (
    style_preset IN ('educational', 'premium_travel', 'hard_sell', 'storytelling')
  ),
  CONSTRAINT ai_thumbnail_generations_headlines_array CHECK (
    jsonb_typeof(headlines) = 'array'
  ),
  CONSTRAINT ai_thumbnail_generations_concept_object CHECK (
    jsonb_typeof(concept) = 'object'
  ),
  CONSTRAINT ai_thumbnail_generations_images_array CHECK (
    jsonb_typeof(image_variations) = 'array'
  )
);

CREATE INDEX ai_thumbnail_generations_organization_id_idx
  ON public.ai_thumbnail_generations (organization_id, created_at DESC);

CREATE INDEX ai_thumbnail_generations_content_generation_id_idx
  ON public.ai_thumbnail_generations (ai_content_generation_id)
  WHERE ai_content_generation_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_ai_thumbnail_generation_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ai_content_generation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.ai_content_generations g
    WHERE g.id = NEW.ai_content_generation_id
      AND g.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'ai_content_generation_id must belong to the same organization';
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

CREATE TRIGGER ai_thumbnail_generations_validate_org
  BEFORE INSERT OR UPDATE ON public.ai_thumbnail_generations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ai_thumbnail_generation_org();

ALTER TABLE public.ai_thumbnail_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_thumbnail_generations_select_member
  ON public.ai_thumbnail_generations
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY ai_thumbnail_generations_insert_admin
  ON public.ai_thumbnail_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY ai_thumbnail_generations_update_admin
  ON public.ai_thumbnail_generations
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

ALTER TABLE public.contents
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_headline text,
  ADD COLUMN IF NOT EXISTS ai_thumbnail_generation_id uuid
    REFERENCES public.ai_thumbnail_generations (id) ON DELETE SET NULL;

CREATE INDEX contents_ai_thumbnail_generation_id_idx
  ON public.contents (ai_thumbnail_generation_id)
  WHERE ai_thumbnail_generation_id IS NOT NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-thumbnails',
  'content-thumbnails',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY content_thumbnails_public_read
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'content-thumbnails');
