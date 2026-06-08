-- Extend lead_source enum for Lead Source Tracking V1

ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'meta_ads';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'tiktok';
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'repeat_customer';
