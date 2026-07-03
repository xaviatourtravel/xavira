-- Business Brain Products: teach AI about sellable packages and services.

CREATE TABLE public.brain_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_brain_id uuid NOT NULL REFERENCES public.business_brains (id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  destination text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  pricing jsonb NOT NULL DEFAULT '[]'::jsonb,
  departures jsonb NOT NULL DEFAULT '[]'::jsonb,
  included jsonb NOT NULL DEFAULT '[]'::jsonb,
  excluded jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brain_products_highlights_is_array
    CHECK (jsonb_typeof(highlights) = 'array'),
  CONSTRAINT brain_products_pricing_is_array
    CHECK (jsonb_typeof(pricing) = 'array'),
  CONSTRAINT brain_products_departures_is_array
    CHECK (jsonb_typeof(departures) = 'array'),
  CONSTRAINT brain_products_included_is_array
    CHECK (jsonb_typeof(included) = 'array'),
  CONSTRAINT brain_products_excluded_is_array
    CHECK (jsonb_typeof(excluded) = 'array'),
  CONSTRAINT brain_products_status_valid
    CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE INDEX brain_products_business_brain_id_idx
  ON public.brain_products (business_brain_id);

CREATE INDEX brain_products_status_idx
  ON public.brain_products (status);

CREATE TRIGGER brain_products_updated_at
  BEFORE UPDATE ON public.brain_products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.product_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.brain_products (id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_name text,
  file_path text,
  file_url text,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_documents_type_valid
    CHECK (document_type IN ('itinerary', 'brochure', 'gallery', 'video')),
  CONSTRAINT product_documents_has_source
    CHECK (file_path IS NOT NULL OR file_url IS NOT NULL)
);

CREATE INDEX product_documents_product_id_idx
  ON public.product_documents (product_id);

CREATE TRIGGER product_documents_updated_at
  BEFORE UPDATE ON public.product_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.product_faq_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.brain_products (id) ON DELETE CASCADE,
  knowledge_entry_id uuid NOT NULL REFERENCES public.knowledge_entries (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_faq_links_unique
    UNIQUE (product_id, knowledge_entry_id)
);

CREATE INDEX product_faq_links_product_id_idx
  ON public.product_faq_links (product_id);

CREATE INDEX product_faq_links_knowledge_entry_id_idx
  ON public.product_faq_links (knowledge_entry_id);

ALTER TABLE public.brain_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_faq_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY brain_products_select_member
  ON public.brain_products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_products.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY brain_products_insert_admin
  ON public.brain_products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_products.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_products_update_admin
  ON public.brain_products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_products.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_products.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_products_delete_admin
  ON public.brain_products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_products.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY product_documents_select_member
  ON public.product_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.brain_products bp
      JOIN public.business_brains bb ON bb.id = bp.business_brain_id
      WHERE bp.id = product_documents.product_id
        AND bb.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY product_documents_insert_admin
  ON public.product_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.brain_products bp
      JOIN public.business_brains bb ON bb.id = bp.business_brain_id
      WHERE bp.id = product_documents.product_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY product_documents_update_admin
  ON public.product_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.brain_products bp
      JOIN public.business_brains bb ON bb.id = bp.business_brain_id
      WHERE bp.id = product_documents.product_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.brain_products bp
      JOIN public.business_brains bb ON bb.id = bp.business_brain_id
      WHERE bp.id = product_documents.product_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY product_documents_delete_admin
  ON public.product_documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.brain_products bp
      JOIN public.business_brains bb ON bb.id = bp.business_brain_id
      WHERE bp.id = product_documents.product_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY product_faq_links_select_member
  ON public.product_faq_links
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.brain_products bp
      JOIN public.business_brains bb ON bb.id = bp.business_brain_id
      WHERE bp.id = product_faq_links.product_id
        AND bb.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY product_faq_links_insert_admin
  ON public.product_faq_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.brain_products bp
      JOIN public.business_brains bb ON bb.id = bp.business_brain_id
      WHERE bp.id = product_faq_links.product_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY product_faq_links_delete_admin
  ON public.product_faq_links
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.brain_products bp
      JOIN public.business_brains bb ON bb.id = bp.business_brain_id
      WHERE bp.id = product_faq_links.product_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brain-product-files',
  'brain-product-files',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;
