-- Campaigns Lite V1: attribution fields on campaigns + campaign_id on leads

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS source public.lead_source DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS budget numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.campaigns (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS leads_campaign_id_idx ON public.leads (campaign_id)
  WHERE campaign_id IS NOT NULL;
