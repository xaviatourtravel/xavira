-- Business Brain Knowledge: structured articles for AI source of truth.

CREATE TABLE public.brain_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_brain_id uuid NOT NULL REFERENCES public.business_brains (id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'faq',
  content text NOT NULL DEFAULT '',
  keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  visibility text NOT NULL DEFAULT 'ai_only',
  status text NOT NULL DEFAULT 'draft',
  ai_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brain_articles_keywords_is_array
    CHECK (jsonb_typeof(keywords) = 'array'),
  CONSTRAINT brain_articles_ai_metadata_is_object
    CHECK (jsonb_typeof(ai_metadata) = 'object'),
  CONSTRAINT brain_articles_category_valid
    CHECK (
      category IN (
        'faq',
        'payment',
        'visa',
        'halal',
        'terms',
        'refund',
        'insurance',
        'custom'
      )
    ),
  CONSTRAINT brain_articles_visibility_valid
    CHECK (visibility IN ('internal', 'ai_only', 'public')),
  CONSTRAINT brain_articles_status_valid
    CHECK (status IN ('draft', 'published'))
);

CREATE INDEX brain_articles_business_brain_id_idx
  ON public.brain_articles (business_brain_id);

CREATE INDEX brain_articles_category_idx
  ON public.brain_articles (category);

CREATE INDEX brain_articles_status_idx
  ON public.brain_articles (status);

CREATE TRIGGER brain_articles_updated_at
  BEFORE UPDATE ON public.brain_articles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.brain_article_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.brain_articles (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.brain_products (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brain_article_products_unique
    UNIQUE (article_id, product_id)
);

CREATE INDEX brain_article_products_article_id_idx
  ON public.brain_article_products (article_id);

CREATE INDEX brain_article_products_product_id_idx
  ON public.brain_article_products (product_id);

ALTER TABLE public.brain_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_article_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY brain_articles_select_member
  ON public.brain_articles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_articles.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY brain_articles_insert_admin
  ON public.brain_articles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_articles.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_articles_update_admin
  ON public.brain_articles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_articles.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_articles.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_articles_delete_admin
  ON public.brain_articles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_brains bb
      WHERE bb.id = brain_articles.business_brain_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_article_products_select_member
  ON public.brain_article_products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.brain_articles ba
      JOIN public.business_brains bb ON bb.id = ba.business_brain_id
      WHERE ba.id = brain_article_products.article_id
        AND bb.organization_id = public.get_my_organization_id()
    )
  );

CREATE POLICY brain_article_products_insert_admin
  ON public.brain_article_products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.brain_articles ba
      JOIN public.business_brains bb ON bb.id = ba.business_brain_id
      WHERE ba.id = brain_article_products.article_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );

CREATE POLICY brain_article_products_delete_admin
  ON public.brain_article_products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.brain_articles ba
      JOIN public.business_brains bb ON bb.id = ba.business_brain_id
      WHERE ba.id = brain_article_products.article_id
        AND bb.organization_id = public.get_my_organization_id()
        AND public.is_org_admin_or_owner()
    )
  );
