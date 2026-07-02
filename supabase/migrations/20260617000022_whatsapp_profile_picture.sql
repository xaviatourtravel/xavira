-- Cached WhatsApp contact profile pictures (one per conversation / phone).

ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS profile_picture_url text,
  ADD COLUMN IF NOT EXISTS profile_picture_updated_at timestamptz;

COMMENT ON COLUMN public.whatsapp_conversations.profile_picture_url IS
  'Cached WhatsApp profile photo URL from Evolution API (expires on WA CDN; refresh via cache TTL).';

COMMENT ON COLUMN public.whatsapp_conversations.profile_picture_updated_at IS
  'Last time profile_picture_url was fetched or confirmed absent (7-day cache window).';
