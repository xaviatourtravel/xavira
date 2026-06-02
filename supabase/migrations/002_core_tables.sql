-- 002_core_tables.sql
-- Extensions, shared triggers, core tenant tables, packages, knowledge bases

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  business_type public.business_type NOT NULL DEFAULT 'both',
  phone text,
  city text,
  timezone text NOT NULL DEFAULT 'Asia/Jakarta',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE UNIQUE INDEX organizations_slug_idx ON public.organizations (slug);

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  full_name text,
  role public.user_role NOT NULL DEFAULT 'agent',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_organization_id_idx ON public.profiles (organization_id);
CREATE INDEX profiles_role_idx ON public.profiles (organization_id, role);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations (id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'starter',
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  price_idr integer NOT NULL DEFAULT 500000,
  current_period_start timestamptz,
  current_period_end timestamptz,
  external_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_price_idr_positive CHECK (price_idr > 0)
);

CREATE INDEX subscriptions_status_idx ON public.subscriptions (status);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL,
  destination text,
  price_idr integer,
  duration_days integer,
  departure_date date,
  quota integer,
  status public.package_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT packages_price_idr_non_negative CHECK (price_idr IS NULL OR price_idr >= 0),
  CONSTRAINT packages_duration_days_positive CHECK (duration_days IS NULL OR duration_days > 0),
  CONSTRAINT packages_quota_non_negative CHECK (quota IS NULL OR quota >= 0)
);

CREATE INDEX packages_organization_id_idx ON public.packages (organization_id);
CREATE INDEX packages_organization_status_idx ON public.packages (organization_id, status);
CREATE INDEX packages_departure_date_idx ON public.packages (organization_id, departure_date);

CREATE TRIGGER packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.knowledge_bases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX knowledge_bases_organization_id_idx ON public.knowledge_bases (organization_id);

CREATE TRIGGER knowledge_bases_updated_at
  BEFORE UPDATE ON public.knowledge_bases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  knowledge_base_id uuid NOT NULL REFERENCES public.knowledge_bases (id) ON DELETE CASCADE,
  title text NOT NULL,
  file_url text,
  content text,
  metadata jsonb default '{}'::jsonb
  embedding_status public.embedding_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX knowledge_documents_organization_id_idx ON public.knowledge_documents (organization_id);
CREATE INDEX knowledge_documents_knowledge_base_id_idx ON public.knowledge_documents (knowledge_base_id);
CREATE INDEX knowledge_documents_embedding_status_idx ON public.knowledge_documents (organization_id, embedding_status);

CREATE OR REPLACE FUNCTION public.validate_knowledge_document_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.knowledge_bases kb
    WHERE kb.id = NEW.knowledge_base_id
      AND kb.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'knowledge_base_id must belong to the same organization';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER knowledge_documents_validate_org
  BEFORE INSERT OR UPDATE ON public.knowledge_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_knowledge_document_org();

CREATE OR REPLACE FUNCTION public.get_my_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin_or_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'owner'
  );
$$;
