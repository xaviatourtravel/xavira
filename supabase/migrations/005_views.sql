-- 005_views.sql
-- Performance dashboard views

CREATE OR REPLACE VIEW public.metric_daily
WITH (security_invoker = true)
AS
WITH lead_days AS (
  SELECT
    l.organization_id,
    (l.created_at AT TIME ZONE COALESCE(o.timezone, 'Asia/Jakarta'))::date AS metric_date,
    l.id AS lead_id,
    l.status,
    l.budget_idr,
    l.deleted_at
  FROM public.leads l
  INNER JOIN public.organizations o ON o.id = l.organization_id
),
score_days AS (
  SELECT
    ls.organization_id,
    (ls.computed_at AT TIME ZONE COALESCE(o.timezone, 'Asia/Jakarta'))::date AS metric_date,
    ls.score
  FROM public.lead_scores ls
  INNER JOIN public.organizations o ON o.id = ls.organization_id
),
follow_up_days AS (
  SELECT
    fu.organization_id,
    (fu.sent_at AT TIME ZONE COALESCE(o.timezone, 'Asia/Jakarta'))::date AS metric_date,
    fu.id
  FROM public.follow_ups fu
  INNER JOIN public.organizations o ON o.id = fu.organization_id
  WHERE fu.status = 'sent'
    AND fu.sent_at IS NOT NULL
),
dates AS (
  SELECT organization_id, metric_date FROM lead_days WHERE deleted_at IS NULL
  UNION
  SELECT organization_id, metric_date FROM score_days
  UNION
  SELECT organization_id, metric_date FROM follow_up_days
)
SELECT
  d.organization_id,
  d.metric_date,
  COUNT(DISTINCT ld.lead_id) FILTER (
    WHERE ld.deleted_at IS NULL
  ) AS new_leads,
  COUNT(DISTINCT ld.lead_id) FILTER (
    WHERE ld.deleted_at IS NULL
      AND ld.status IN ('contacted', 'qualified', 'proposal_sent', 'negotiating', 'won', 'lost')
  ) AS contacted_leads,
  COUNT(DISTINCT ld.lead_id) FILTER (
    WHERE ld.deleted_at IS NULL
      AND ld.status IN ('qualified', 'proposal_sent', 'negotiating', 'won')
  ) AS qualified_leads,
  COUNT(DISTINCT ld.lead_id) FILTER (
    WHERE ld.deleted_at IS NULL AND ld.status = 'won'
  ) AS won_leads,
  COUNT(DISTINCT ld.lead_id) FILTER (
    WHERE ld.deleted_at IS NULL AND ld.status = 'lost'
  ) AS lost_leads,
  CASE
    WHEN COUNT(DISTINCT ld.lead_id) FILTER (WHERE ld.deleted_at IS NULL) = 0 THEN 0
    ELSE ROUND(
      (
        COUNT(DISTINCT ld.lead_id) FILTER (WHERE ld.deleted_at IS NULL AND ld.status = 'won')::numeric
        / NULLIF(COUNT(DISTINCT ld.lead_id) FILTER (WHERE ld.deleted_at IS NULL), 0)::numeric
      ) * 100,
      2
    )
  END AS conversion_rate,
  ROUND(AVG(sd.score)::numeric, 2) AS avg_score,
  COUNT(DISTINCT fud.id) AS follow_ups_sent,
  COALESCE(
    SUM(ld.budget_idr) FILTER (WHERE ld.deleted_at IS NULL AND ld.status = 'won'),
    0
  ) AS revenue_idr
FROM dates d
LEFT JOIN lead_days ld
  ON ld.organization_id = d.organization_id
  AND ld.metric_date = d.metric_date
LEFT JOIN score_days sd
  ON sd.organization_id = d.organization_id
  AND sd.metric_date = d.metric_date
LEFT JOIN follow_up_days fud
  ON fud.organization_id = d.organization_id
  AND fud.metric_date = d.metric_date
GROUP BY d.organization_id, d.metric_date;

COMMENT ON VIEW public.metric_daily IS 'Daily aggregated KPIs per organization for the performance dashboard.';

GRANT SELECT ON public.metric_daily TO authenticated;
