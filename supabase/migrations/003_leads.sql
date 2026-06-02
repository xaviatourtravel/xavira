-- 003_leads.sql
-- Lead manager and lead scoring

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  whatsapp_number text,
  email text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  source public.lead_source NOT NULL DEFAULT 'other',
  source_detail text,
  interest_type public.interest_type NOT NULL DEFAULT 'unknown',
  package_interest text,
  budget_idr integer,
  travel_date_preference date,
  party_size integer,
  status public.lead_status NOT NULL DEFAULT 'new',
  priority public.lead_priority NOT NULL DEFAULT 'medium',
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_contacted_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT leads_budget_idr_non_negative CHECK (budget_idr IS NULL OR budget_idr >= 0),
  CONSTRAINT leads_party_size_positive CHECK (party_size IS NULL OR party_size > 0),
  CONSTRAINT leads_converted_at_when_won CHECK (
    status = 'won' OR converted_at IS NULL
  )
);

CREATE INDEX leads_organization_id_status_idx ON public.leads (organization_id, status);
CREATE INDEX leads_organization_id_assigned_to_idx ON public.leads (organization_id, assigned_to);
CREATE INDEX leads_organization_id_created_at_idx ON public.leads (organization_id, created_at DESC);
CREATE INDEX leads_organization_id_phone_idx ON public.leads (organization_id, phone);
CREATE INDEX leads_organization_id_whatsapp_idx ON public.leads (organization_id, whatsapp_number);
CREATE INDEX leads_deleted_at_idx ON public.leads (organization_id) WHERE deleted_at IS NULL;
CREATE INDEX leads_organization_email_idx ON public.leads (organization_id, email);

CREATE UNIQUE INDEX leads_organization_phone_active_unique
  ON public.leads (organization_id, phone)
  WHERE deleted_at IS NULL AND phone IS NOT NULL;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.set_lead_converted_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'won' AND OLD.status IS DISTINCT FROM 'won' THEN
    NEW.converted_at = COALESCE(NEW.converted_at, now());
  ELSIF NEW.status IS DISTINCT FROM 'won' THEN
    NEW.converted_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER leads_set_converted_at
  BEFORE INSERT OR UPDATE OF status ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_lead_converted_at();

CREATE OR REPLACE FUNCTION public.validate_lead_assigned_to_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = NEW.assigned_to
      AND p.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'assigned_to must belong to the same organization';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER leads_validate_assigned_to
  BEFORE INSERT OR UPDATE OF assigned_to ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_assigned_to_org();

CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  activity_type public.activity_type NOT NULL,
  title text,
  body text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX lead_activities_organization_id_idx ON public.lead_activities (organization_id);
CREATE INDEX lead_activities_lead_id_occurred_at_idx ON public.lead_activities (lead_id, occurred_at DESC);
CREATE INDEX lead_activities_activity_type_idx ON public.lead_activities (organization_id, activity_type);

CREATE OR REPLACE FUNCTION public.validate_lead_activity_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.leads l
    WHERE l.id = NEW.lead_id
      AND l.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'lead_id must belong to the same organization';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER lead_activities_validate_org
  BEFORE INSERT OR UPDATE ON public.lead_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_activity_org();

CREATE TABLE public.lead_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  lead_id uuid NOT NULL UNIQUE REFERENCES public.leads (id) ON DELETE CASCADE,
  score integer NOT NULL,
  tier public.score_tier NOT NULL,
  factors jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_version text NOT NULL DEFAULT 'rules_v1',
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lead_scores_score_range CHECK (score >= 0 AND score <= 100)
);

CREATE INDEX lead_scores_organization_id_idx ON public.lead_scores (organization_id);
CREATE INDEX lead_scores_organization_id_tier_idx ON public.lead_scores (organization_id, tier);
CREATE INDEX lead_scores_organization_id_score_idx ON public.lead_scores (organization_id, score DESC);

CREATE TRIGGER lead_scores_updated_at
  BEFORE UPDATE ON public.lead_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.validate_lead_score_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.leads l
    WHERE l.id = NEW.lead_id
      AND l.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'lead_id must belong to the same organization';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER lead_scores_validate_org
  BEFORE INSERT OR UPDATE ON public.lead_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_score_org();
