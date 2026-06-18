-- Link Content Board items to Instagram posts by permalink or media id.

ALTER TABLE public.contents
  ADD COLUMN IF NOT EXISTS instagram_permalink text;

CREATE INDEX contents_instagram_media_id_idx
  ON public.contents (organization_id, instagram_media_id)
  WHERE instagram_media_id IS NOT NULL;

CREATE INDEX contents_instagram_permalink_idx
  ON public.contents (organization_id, instagram_permalink)
  WHERE instagram_permalink IS NOT NULL;
