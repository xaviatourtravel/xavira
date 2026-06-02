-- 004_ai_and_campaigns.sql
-- Follow-ups, AI logs, campaigns, content, scripts, imports, dashboard cache

CREATE TABLE public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  channel public.follow_up_channel NOT NULL DEFAULT 'whatsapp',
  tone public.follow_up_tone NOT NULL DEFAULT 'friendly',
  language text NOT NULL DEFAULT 'id',
  prompt_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_subject text,
  generated_body text NOT NULL,
  final_body text,
  status public.follow_up_status NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  openai_usage jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT follow_ups_sent_at_when_sent CHECK (
    status = 'sent' OR sent_at IS NULL
  )
);

CREATE INDEX follow_ups_organization_id_idx ON public.follow_ups (organization_id);
CREATE INDEX follow_ups_lead_id_idx ON public.follow_ups (lead_id, created_at DESC);
CREATE INDEX follow_ups_status_idx ON public.follow_ups (organization_id, status);

CREATE TRIGGER follow_ups_updated_at
  BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.validate_follow_up_org()
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

  IF NOT EXISTS (
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

CREATE TRIGGER follow_ups_validate_org
  BEFORE INSERT OR UPDATE ON public.follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_follow_up_org();

CREATE OR REPLACE FUNCTION public.set_follow_up_sent_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'sent' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'sent') THEN
    NEW.sent_at = COALESCE(NEW.sent_at, now());
  ELSIF TG_OP = 'UPDATE'
    AND NEW.status IS DISTINCT FROM 'sent'
    AND OLD.status = 'sent' THEN
    NEW.sent_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER follow_ups_set_sent_at
  BEFORE INSERT OR UPDATE OF status ON public.follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.set_follow_up_sent_at();

CREATE TABLE public.ai_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  feature public.ai_feature NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(12, 6) NOT NULL DEFAULT 0,
  reference_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_generation_logs_tokens_non_negative CHECK (
    input_tokens >= 0 AND output_tokens >= 0
  ),
  CONSTRAINT ai_generation_logs_cost_non_negative CHECK (estimated_cost_usd >= 0)
);

CREATE INDEX ai_generation_logs_organization_id_idx ON public.ai_generation_logs (organization_id, created_at DESC);
CREATE INDEX ai_generation_logs_feature_idx ON public.ai_generation_logs (organization_id, feature);
CREATE INDEX ai_generation_logs_user_id_idx ON public.ai_generation_logs (user_id, created_at DESC);
CREATE INDEX ai_generation_logs_reference_id_idx ON public.ai_generation_logs (reference_id);

CREATE OR REPLACE FUNCTION public.validate_ai_log_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = NEW.user_id
      AND p.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'user_id must belong to the same organization';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER ai_generation_logs_validate_org
  BEFORE INSERT OR UPDATE ON public.ai_generation_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_ai_log_org();

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text,
  campaign_type public.campaign_type NOT NULL DEFAULT 'custom',
  target_interest public.interest_type NOT NULL DEFAULT 'both',
  status public.campaign_status NOT NULL DEFAULT 'draft',
  start_date date,
  end_date date,
  message_template text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_target_interest_valid CHECK (
    target_interest IN ('umroh', 'halal_tour', 'both')
  ),
  CONSTRAINT campaigns_date_range CHECK (
    start_date IS NULL OR end_date IS NULL OR start_date <= end_date
  )
);

CREATE INDEX campaigns_organization_id_idx ON public.campaigns (organization_id);
CREATE INDEX campaigns_organization_status_idx ON public.campaigns (organization_id, status);
CREATE INDEX campaigns_date_range_idx ON public.campaigns (organization_id, start_date, end_date);

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.validate_campaign_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
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

CREATE TRIGGER campaigns_validate_org
  BEFORE INSERT OR UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_campaign_org();

CREATE TABLE public.campaign_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns (id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  status public.campaign_lead_status NOT NULL DEFAULT 'enrolled',
  CONSTRAINT campaign_leads_campaign_lead_unique UNIQUE (campaign_id, lead_id)
);

CREATE INDEX campaign_leads_organization_id_idx ON public.campaign_leads (organization_id);
CREATE INDEX campaign_leads_campaign_id_idx ON public.campaign_leads (campaign_id, status);
CREATE INDEX campaign_leads_lead_id_idx ON public.campaign_leads (lead_id);

CREATE OR REPLACE FUNCTION public.validate_campaign_lead_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.campaigns c
    WHERE c.id = NEW.campaign_id
      AND c.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'campaign_id must belong to the same organization';
  END IF;

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

CREATE TRIGGER campaign_leads_validate_org
  BEFORE INSERT OR UPDATE ON public.campaign_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_campaign_lead_org();

CREATE TABLE public.content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  content_type public.content_type NOT NULL,
  platform public.content_platform NOT NULL DEFAULT 'generic',
  topic text,
  title text,
  body text NOT NULL,
  hashtags text[] NOT NULL DEFAULT '{}'::text[],
  language text NOT NULL DEFAULT 'id',
  status public.content_status NOT NULL DEFAULT 'draft',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX content_items_organization_id_idx ON public.content_items (organization_id);
CREATE INDEX content_items_status_idx ON public.content_items (organization_id, status);
CREATE INDEX content_items_content_type_idx ON public.content_items (organization_id, content_type);

CREATE TRIGGER content_items_updated_at
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.validate_content_item_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
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

CREATE TRIGGER content_items_validate_org
  BEFORE INSERT OR UPDATE ON public.content_items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_content_item_org();

CREATE TABLE public.sales_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  name text NOT NULL,
  scenario public.sales_script_scenario NOT NULL,
  target_interest public.interest_type NOT NULL DEFAULT 'both',
  script_body text NOT NULL,
  key_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_template boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT 'id',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_scripts_target_interest_valid CHECK (
    target_interest IN ('umroh', 'halal_tour', 'both')
  )
);

CREATE INDEX sales_scripts_organization_id_idx ON public.sales_scripts (organization_id);
CREATE INDEX sales_scripts_scenario_idx ON public.sales_scripts (organization_id, scenario);
CREATE INDEX sales_scripts_is_template_idx ON public.sales_scripts (organization_id, is_template);

CREATE TRIGGER sales_scripts_updated_at
  BEFORE UPDATE ON public.sales_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.validate_sales_script_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
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

CREATE TRIGGER sales_scripts_validate_org
  BEFORE INSERT OR UPDATE ON public.sales_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_sales_script_org();

CREATE TABLE public.imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  file_path text NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  success_count integer NOT NULL DEFAULT 0,
  error_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.import_status NOT NULL DEFAULT 'processing',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT imports_row_count_non_negative CHECK (row_count >= 0),
  CONSTRAINT imports_success_count_non_negative CHECK (success_count >= 0),
  CONSTRAINT imports_success_lte_row_count CHECK (success_count <= row_count)
);

CREATE INDEX imports_organization_id_idx ON public.imports (organization_id, created_at DESC);
CREATE INDEX imports_status_idx ON public.imports (organization_id, status);

CREATE OR REPLACE FUNCTION public.validate_import_org()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = NEW.uploaded_by
      AND p.organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'uploaded_by must belong to the same organization';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER imports_validate_org
  BEFORE INSERT OR UPDATE ON public.imports
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_import_org();

CREATE TABLE public.dashboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dashboard_snapshots_org_date_unique UNIQUE (organization_id, snapshot_date)
);

CREATE INDEX dashboard_snapshots_organization_id_idx ON public.dashboard_snapshots (organization_id, snapshot_date DESC);
