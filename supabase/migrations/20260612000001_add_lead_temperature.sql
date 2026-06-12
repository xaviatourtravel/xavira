-- Lead Temperature V1: manual hot/warm/cold classification (separate from pipeline status)

ALTER TABLE public.leads
  ADD COLUMN lead_temperature text;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_lead_temperature_valid CHECK (
    lead_temperature IS NULL OR lead_temperature IN ('hot', 'warm', 'cold')
  );

CREATE INDEX leads_organization_id_lead_temperature_idx
  ON public.leads (organization_id, lead_temperature);
