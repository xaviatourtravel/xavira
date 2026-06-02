-- 001_enums.sql
-- Xavira MVP enum types

CREATE TYPE public.business_type AS ENUM (
  'umroh',
  'halal_tour',
  'both'
);

CREATE TYPE public.user_role AS ENUM (
  'owner',
  'admin',
  'agent'
);

CREATE TYPE public.subscription_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'canceled'
);

CREATE TYPE public.lead_source AS ENUM (
  'whatsapp',
  'instagram',
  'facebook',
  'referral',
  'walk_in',
  'website',
  'other'
);

CREATE TYPE public.interest_type AS ENUM (
  'umroh',
  'halal_tour',
  'both',
  'unknown'
);

CREATE TYPE public.lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'proposal_sent',
  'negotiating',
  'won',
  'lost'
);

CREATE TYPE public.lead_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE public.activity_type AS ENUM (
  'note',
  'call',
  'whatsapp',
  'email',
  'status_change',
  'score_update',
  'follow_up_sent',
  'follow_up_generated'
);

CREATE TYPE public.score_tier AS ENUM (
  'cold',
  'warm',
  'hot'
);

CREATE TYPE public.follow_up_channel AS ENUM (
  'whatsapp',
  'email',
  'sms'
);

CREATE TYPE public.follow_up_tone AS ENUM (
  'friendly',
  'professional',
  'urgent'
);

CREATE TYPE public.follow_up_status AS ENUM (
  'draft',
  'approved',
  'sent',
  'discarded'
);

CREATE TYPE public.campaign_type AS ENUM (
  'seasonal_promo',
  're_engagement',
  'new_package',
  'custom'
);

CREATE TYPE public.campaign_status AS ENUM (
  'draft',
  'active',
  'paused',
  'completed'
);

CREATE TYPE public.campaign_lead_status AS ENUM (
  'enrolled',
  'contacted',
  'converted',
  'removed'
);

CREATE TYPE public.content_type AS ENUM (
  'social_post',
  'whatsapp_broadcast',
  'brochure_copy',
  'caption'
);

CREATE TYPE public.content_platform AS ENUM (
  'instagram',
  'facebook',
  'whatsapp',
  'generic'
);

CREATE TYPE public.content_status AS ENUM (
  'draft',
  'published',
  'archived'
);

CREATE TYPE public.sales_script_scenario AS ENUM (
  'first_contact',
  'pricing_objection',
  'competitor_comparison',
  'closing',
  'follow_up_no_reply',
  'custom'
  'passport_issue'
);

CREATE TYPE public.ai_feature AS ENUM (
  'follow_up',
  'content',
  'sales_script',
  'lead_scoring'
);

CREATE TYPE public.import_status AS ENUM (
  'processing',
  'completed',
  'failed'
);

CREATE TYPE public.package_status AS ENUM (
  'draft',
  'active',
  'inactive',
  'sold_out'
);

CREATE TYPE public.embedding_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

CREATE TYPE public.subscription_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'expired',
  'canceled'
);


