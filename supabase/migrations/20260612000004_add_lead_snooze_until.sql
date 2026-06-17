-- Lead Automation Engine V1: snooze leads from follow-up queue

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS snooze_until timestamptz;

CREATE INDEX IF NOT EXISTS leads_snooze_until_idx
  ON public.leads (organization_id, snooze_until)
  WHERE snooze_until IS NOT NULL;
