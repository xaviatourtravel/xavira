-- Organization-level onboarding tracking for First Run Experience.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Existing workspaces (including Xavia) are treated as already configured.
UPDATE public.organizations
SET
  onboarding_completed = true,
  onboarding_completed_at = COALESCE(
    NULLIF(settings->'firstRun'->>'completedAt', '')::timestamptz,
    created_at
  ),
  industry = COALESCE(
    industry,
    NULLIF(settings->'firstRun'->>'industry', ''),
    NULLIF(settings->'product'->>'primaryIndustry', '')
  )
WHERE onboarding_completed = false;
