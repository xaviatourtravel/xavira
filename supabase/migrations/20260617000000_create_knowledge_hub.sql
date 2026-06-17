-- Knowledge Hub V1: centralized, organization-scoped knowledge repository
-- that powers AI features (Content Studio, Sales Assistant, future chatbot).

CREATE TYPE public.knowledge_category AS ENUM (
  'product_knowledge',
  'sop',
  'faq',
  'marketing_assets'
);

CREATE TABLE public.knowledge_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  title text NOT NULL,
  category public.knowledge_category NOT NULL DEFAULT 'product_knowledge',
  tags text[] NOT NULL DEFAULT '{}'::text[],
  content text NOT NULL DEFAULT '',
  summary text,
  key_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_status text NOT NULL DEFAULT 'pending',
  source_type text NOT NULL DEFAULT 'manual',
  file_path text,
  file_name text,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_entries_ai_status_valid
    CHECK (ai_status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT knowledge_entries_source_type_valid
    CHECK (source_type IN ('manual', 'upload')),
  CONSTRAINT knowledge_entries_key_points_is_array
    CHECK (jsonb_typeof(key_points) = 'array'),
  CONSTRAINT knowledge_entries_faq_is_array
    CHECK (jsonb_typeof(faq) = 'array'),
  CONSTRAINT knowledge_entries_ai_metadata_is_object
    CHECK (jsonb_typeof(ai_metadata) = 'object')
);

-- array_to_string is only STABLE, so it cannot be used directly inside a
-- GENERATED ALWAYS ... STORED expression. Wrap it in an IMMUTABLE helper.
CREATE OR REPLACE FUNCTION public.knowledge_tags_to_text(tags text[])
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT coalesce(array_to_string(tags, ' '), '');
$$;

-- Full-text search vector across title, content, summary, and tags.
ALTER TABLE public.knowledge_entries
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', public.knowledge_tags_to_text(tags)), 'B') ||
    setweight(to_tsvector('simple', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(content, '')), 'C')
  ) STORED;

CREATE INDEX knowledge_entries_search_vector_idx
  ON public.knowledge_entries USING gin (search_vector);

CREATE INDEX knowledge_entries_org_category_idx
  ON public.knowledge_entries (organization_id, category);

CREATE INDEX knowledge_entries_tags_idx
  ON public.knowledge_entries USING gin (tags);

CREATE TRIGGER knowledge_entries_updated_at
  BEFORE UPDATE ON public.knowledge_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY knowledge_entries_select_member
  ON public.knowledge_entries
  FOR SELECT
  TO authenticated
  USING (organization_id = public.get_my_organization_id());

CREATE POLICY knowledge_entries_insert_admin
  ON public.knowledge_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

CREATE POLICY knowledge_entries_update_admin
  ON public.knowledge_entries
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

CREATE POLICY knowledge_entries_delete_admin
  ON public.knowledge_entries
  FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_my_organization_id()
    AND public.is_org_admin_or_owner()
  );

-- Private bucket for source documents. Uploads and signed-url reads go through
-- the service-role admin client, so no public storage policies are created.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-files',
  'knowledge-files',
  false,
  20971520,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;
