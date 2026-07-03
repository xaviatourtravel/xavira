-- Business Brain Documents: teach AI what files to send and when.

CREATE TABLE public.brain_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_brain_id uuid NOT NULL REFERENCES public.business_brains (id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  storage_path text,
  public_url text,
  mime_type text,
  file_size bigint,
  document_type text NOT NULL DEFAULT 'pdf',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  auto_send_enabled boolean NOT NULL DEFAULT false,
  ai_notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brain_documents_tags_is_array
    CHECK (jsonb_typeof(tags) = 'array'),
  CONSTRAINT brain_documents_type_valid
    CHECK (document_type IN ('pdf', 'image', 'video', 'url')),
  CONSTRAINT brain_documents_status_valid
    CHECK (status IN ('draft', 'published')),
  CONSTRAINT brain_documents_has_source
    CHECK (storage_path IS NOT NULL OR public_url IS NOT NULL OR document_type = 'url')
);

CREATE INDEX brain_documents_business_brain_id_idx
  ON public.brain_documents (business_brain_id);

CREATE INDEX brain_documents_status_idx
  ON public.brain_documents (status);

CREATE TRIGGER brain_documents_updated_at
  BEFORE UPDATE ON public.brain_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.brain_document_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.brain_documents (id) ON DELETE CASCADE,
  trigger_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brain_document_triggers_trigger_valid
    CHECK (
      trigger_key IN (
        'customer_asks_itinerary',
        'customer_asks_brochure',
        'customer_asks_package_details',
        'customer_asks_visa',
        'customer_asks_payment',
        'customer_asks_company_profile'
      )
    ),
  CONSTRAINT brain_document_triggers_unique
    UNIQUE (document_id, trigger_key)
);

CREATE INDEX brain_document_triggers_document_id_idx
  ON public.brain_document_triggers (document_id);

CREATE TABLE public.brain_document_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.brain_documents (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.brain_products (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brain_document_products_unique
    UNIQUE (document_id, product_id)
);

CREATE INDEX brain_document_products_document_id_idx
  ON public.brain_document_products (document_id);

CREATE TABLE public.brain_document_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.brain_documents (id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES public.brain_articles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brain_document_articles_unique
    UNIQUE (document_id, article_id)
);

CREATE INDEX brain_document_articles_document_id_idx
  ON public.brain_document_articles (document_id);

ALTER TABLE public.brain_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_document_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_document_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_document_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY brain_documents_select_member
  ON public.brain_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_documents.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY brain_documents_insert_admin
  ON public.brain_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_documents.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_documents_update_admin
  ON public.brain_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_documents.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_documents.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_documents_delete_admin
  ON public.brain_documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_documents.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_document_triggers_select_member
  ON public.brain_document_triggers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.brain_documents bd
      JOIN public.business_brains bb ON bb.id = bd.business_brain_id
      WHERE bd.id = brain_document_triggers.document_id
        AND bb.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY brain_document_triggers_insert_admin
  ON public.brain_document_triggers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.brain_documents bd
      JOIN public.business_brains bb ON bb.id = bd.business_brain_id
      WHERE bd.id = brain_document_triggers.document_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_document_triggers_delete_admin
  ON public.brain_document_triggers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.brain_documents bd
      JOIN public.business_brains bb ON bb.id = bd.business_brain_id
      WHERE bd.id = brain_document_triggers.document_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_document_products_select_member
  ON public.brain_document_products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.brain_documents bd
      JOIN public.business_brains bb ON bb.id = bd.business_brain_id
      WHERE bd.id = brain_document_products.document_id
        AND bb.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY brain_document_products_insert_admin
  ON public.brain_document_products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.brain_documents bd
      JOIN public.business_brains bb ON bb.id = bd.business_brain_id
      WHERE bd.id = brain_document_products.document_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_document_products_delete_admin
  ON public.brain_document_products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.brain_documents bd
      JOIN public.business_brains bb ON bb.id = bd.business_brain_id
      WHERE bd.id = brain_document_products.document_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_document_articles_select_member
  ON public.brain_document_articles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.brain_documents bd
      JOIN public.business_brains bb ON bb.id = bd.business_brain_id
      WHERE bd.id = brain_document_articles.document_id
        AND bb.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY brain_document_articles_insert_admin
  ON public.brain_document_articles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.brain_documents bd
      JOIN public.business_brains bb ON bb.id = bd.business_brain_id
      WHERE bd.id = brain_document_articles.document_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_document_articles_delete_admin
  ON public.brain_document_articles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.brain_documents bd
      JOIN public.business_brains bb ON bb.id = bd.business_brain_id
      WHERE bd.id = brain_document_articles.document_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-brain',
  'business-brain',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;
