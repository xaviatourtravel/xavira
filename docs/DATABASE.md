# Xavira — Database Design (MVP)

This document defines the Supabase (PostgreSQL) schema for the Xavira MVP. The model is multi-tenant, optimized for travel agencies selling Umroh and Halal Tour packages in Indonesia.

packages
- id
- organization_id
- name
- destination
- price_idr
- duration_days
- departure_date
- quota
- status
- created_at
- updated_at

knowledge_bases
- id
- organization_id
- name
- description
- created_at
- updated_at

knowledge_documents
- id
- organization_id
- knowledge_base_id
- title
- file_url
- content
- embedding_status
- created_at
---

## Design Principles

| Principle | Rationale |
|-----------|-----------|
| **Tenant isolation** | Every business row is scoped to `organization_id`. Supabase Row Level Security (RLS) enforces access. |
| **Auditability** | `created_at`, `updated_at`, and soft-delete where user-facing data can be recovered. |
| **MVP simplicity** | Prefer normalized tables over premature JSON blobs. Use JSONB only for AI outputs and flexible metadata. |
| **Indonesia-first** | Phone numbers stored in E.164. Currency defaults to IDR. Timezone defaults to `Asia/Jakarta`. |

---

## Entity Relationship Overview

```
organizations ──┬── profiles (users)
                ├── subscriptions
                ├── leads ──┬── lead_activities
                │           ├── lead_scores
                │           └── follow_ups
                ├── campaigns ── campaign_leads
                ├── content_items
                ├── sales_scripts
                └── dashboard_snapshots (optional cache)
```

---

## Core Tables

### `organizations`

Represents a travel agency tenant.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | Default `gen_random_uuid()` |
| `name` | `text` NOT NULL | Agency name |
| `slug` | `text` UNIQUE | URL-safe identifier |
| `business_type` | `enum` | `umroh`, `halal_tour`, `both` |
| `phone` | `text` | Primary contact |
| `city` | `text` | |
| `timezone` | `text` | Default `Asia/Jakarta` |
| `settings` | `jsonb` | Brand voice, default package types, scoring weights |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

---

### `profiles`

Extends Supabase Auth users. One user belongs to one organization in MVP.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | FK → `auth.users.id` |
| `organization_id` | `uuid` FK | → `organizations.id` |
| `full_name` | `text` | |
| `role` | `enum` | `owner`, `admin`, `agent` |
| `avatar_url` | `text` | Optional |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**MVP constraint:** Single organization per user. Multi-org support is post-MVP.

---

### `subscriptions`

Tracks billing status for Rp500.000/month plan.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` FK UNIQUE | One active subscription per org |
| `plan` | `text` | Default `starter` |
| `status` | `enum` | `trialing`, `active`, `past_due`, `canceled` |
| `price_idr` | `integer` | Default `500000` |
| `current_period_start` | `timestamptz` | |
| `current_period_end` | `timestamptz` | |
| `external_subscription_id` | `text` | Midtrans / Xendit reference (post-integration) |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

---

## Lead Manager

### `leads`

Central CRM record for prospects.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` FK | |
| `assigned_to` | `uuid` FK | → `profiles.id`, nullable |
| `full_name` | `text` NOT NULL | |
| `phone` | `text` | Nomor telepon utama |
| `whatsapp_number` | `text` | Nomor WhatsApp jika berbeda dari phone |
| `email` | `text` | Optional |
| `utm_source` | `text` | Google, Facebook, Instagram, TikTok, dll |
| `utm_medium` | `text` | cpc, organic, referral |
| `utm_campaign` | `text` | Nama campaign iklan |
| `source` | `enum` | `whatsapp`, `instagram`, `facebook`, `referral`, `walk_in`, `website`, `other` |
| `source_detail` | `text` | Campaign name, ad ID, referrer name |
| `interest_type` | `enum` | `umroh`, `halal_tour`, `both`, `unknown` |
| `package_interest` | `text` | e.g. "Umroh Reguler 12 hari" |
| `budget_idr` | `integer` | Estimated budget |
| `travel_date_preference` | `date` | Desired departure |
| `party_size` | `integer` | Number of travelers |
| `status` | `enum` | See pipeline below |
| `priority` | `enum` | `low`, `medium`, `high`, `urgent` |
| `notes` | `text` | Free-form agent notes |
| `metadata` | `jsonb` | UTM params, custom fields |
| `last_contacted_at` | `timestamptz` | |
| `converted_at` | `timestamptz` | Set when status = `won` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |
| `deleted_at` | `timestamptz` | Soft delete |

**Lead pipeline (`status`):**

```
new → contacted → qualified → proposal_sent → negotiating → won
                                                          ↘ lost
```

**Indexes (MVP):**

- `(organization_id, status)`
- `(organization_id, assigned_to)`
- `(organization_id, created_at DESC)`
- `(organization_id, phone)` — deduplication lookup

---

### `lead_activities`

Timeline of interactions and system events.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` FK | |
| `lead_id` | `uuid` FK | → `leads.id` |
| `actor_id` | `uuid` FK | → `profiles.id`, nullable for system |
| `activity_type` | `enum` | `note`, `call`, `whatsapp`, `email`, `status_change`, `score_update`, `follow_up_sent`, `follow_up_generated` |
| `title` | `text` | Short summary |
| `body` | `text` | Message content or note |
| `metadata` | `jsonb` | Old/new status, channel, AI run ID |
| `occurred_at` | `timestamptz` | Default `now()` |
| `created_at` | `timestamptz` | |

---

## Lead Scoring

### `lead_scores`

Latest computed score per lead. Historical scores stored in `lead_activities` metadata if needed later.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` FK | |
| `lead_id` | `uuid` FK UNIQUE | One current score per lead |
| `score` | `integer` | 0–100 |
| `tier` | `enum` | `cold`, `warm`, `hot` |
| `factors` | `jsonb` | Breakdown: `{ "budget_match": 20, "urgency": 15, ... }` |
| `model_version` | `text` | `rules_v1` or `ai_v1` |
| `computed_at` | `timestamptz` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**MVP scoring logic (rules-based, no ML training required):**

| Factor | Weight | Example |
|--------|--------|---------|
| Budget vs package fit | 25 | Budget ≥ 80% of package price |
| Travel date within 90 days | 20 | Departure soon |
| Party size ≥ 2 | 10 | Family/group booking |
| Source quality | 15 | Referral > WhatsApp > social |
| Engagement | 20 | Replied within 24h, asked pricing |
| Status progression | 10 | Reached `qualified` or beyond |

Tier mapping: 0–39 cold, 40–69 warm, 70–100 hot.

Post-MVP: optional OpenAI enrichment layer on top of rules.

---

## Follow Up Generator

### `follow_ups`

AI-generated and agent-edited follow-up messages.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` FK | |
| `lead_id` | `uuid` FK | → `leads.id` |
| `created_by` | `uuid` FK | → `profiles.id` |
| `channel` | `enum` | `whatsapp`, `email`, `sms` |
| `tone` | `enum` | `friendly`, `professional`, `urgent` |
| `language` | `text` | Default `id` (Bahasa Indonesia) |
| `prompt_context` | `jsonb` | Lead snapshot sent to OpenAI |
| `generated_subject` | `text` | For email |
| `generated_body` | `text` NOT NULL | AI output |
| `final_body` | `text` | Agent-edited version (what was sent) |
| `status` | `enum` | `draft`, `approved`, `sent`, `discarded` |
| `sent_at` | `timestamptz` | |
| `openai_usage` | `jsonb` | Tokens, model, cost estimate |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

---

## Campaign Engine (MVP-lite)

MVP supports manual campaign creation and batch follow-up assignment—not full automation.

### `campaigns`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` FK | |
| `created_by` | `uuid` FK | → `profiles.id` |
| `name` | `text` NOT NULL | e.g. "Promo Umroh Ramadan 2026" |
| `description` | `text` | |
| `campaign_type` | `enum` | `seasonal_promo`, `re_engagement`, `new_package`, `custom` |
| `target_interest` | `enum` | `umroh`, `halal_tour`, `both` |
| `status` | `enum` | `draft`, `active`, `paused`, `completed` |
| `start_date` | `date` | |
| `end_date` | `date` | |
| `message_template` | `text` | Base copy for AI personalization |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### `campaign_leads`

Join table linking leads to campaigns.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` FK | |
| `campaign_id` | `uuid` FK | |
| `lead_id` | `uuid` FK | |
| `enrolled_at` | `timestamptz` | |
| `status` | `enum` | `enrolled`, `contacted`, `converted`, `removed` |
| UNIQUE | | `(campaign_id, lead_id)` |

---

## Content Engine (MVP-lite)

### `content_items`

AI-generated marketing copy for agents to copy/paste to social or WhatsApp Status.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` FK | |
| `created_by` | `uuid` FK | |
| `content_type` | `enum` | `social_post`, `whatsapp_broadcast`, `brochure_copy`, `caption` |
| `platform` | `enum` | `instagram`, `facebook`, `whatsapp`, `generic` |
| `topic` | `text` | e.g. "Early bird Umroh Maret" |
| `title` | `text` | Optional headline |
| `body` | `text` NOT NULL | Generated content |
| `hashtags` | `text[]` | |
| `language` | `text` | Default `id` |
| `status` | `enum` | `draft`, `published`, `archived` |
| `metadata` | `jsonb` | OpenAI usage, tone, CTA |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

---

## Sales Script Engine (MVP-lite)

### `sales_scripts`

Structured conversation guides for common Umroh/Halal Tour objections.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` FK | |
| `created_by` | `uuid` FK | |
| `name` | `text` NOT NULL | e.g. "Objection: Harga Terlalu Mahal" |
| `scenario` | `enum` | `first_contact`, `pricing_objection`, `competitor_comparison`, `closing`, `follow_up_no_reply`, `custom` |
| `target_interest` | `enum` | `umroh`, `halal_tour`, `both` |
| `script_body` | `text` NOT NULL | Full script or talking points |
| `key_points` | `jsonb` | Array of bullet objections/responses |
| `is_template` | `boolean` | System-provided vs custom |
| `language` | `text` | Default `id` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Seed data:** Ship 5–8 default Umroh/Halal Tour scripts per organization on signup.

---

## Performance Dashboard

MVP computes metrics via SQL views rather than a separate analytics warehouse.

### `metric_daily` (materialized or regular view)

Aggregated per organization per day:

| Metric | Source |
|--------|--------|
| `new_leads` | Count of leads created |
| `contacted_leads` | Status moved to `contacted`+ |
| `qualified_leads` | Status = `qualified`+ |
| `won_leads` | Status = `won` |
| `lost_leads` | Status = `lost` |
| `conversion_rate` | `won / new_leads` |
| `avg_score` | Mean of `lead_scores.score` |
| `follow_ups_sent` | Count where `follow_ups.status = sent` |
| `revenue_idr` | Sum of `leads.budget_idr` where `won` (proxy until booking module exists) |

Optional cache table `dashboard_snapshots` for faster loads if query cost grows.

---

## Supporting Tables

### `ai_generation_logs`

Audit trail for OpenAI calls (cost control, debugging).

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` FK | |
| `user_id` | `uuid` FK | |
| `feature` | `enum` | `follow_up`, `content`, `sales_script`, `lead_scoring` |
| `model` | `text` | e.g. `gpt-4o-mini` |
| `input_tokens` | `integer` | |
| `output_tokens` | `integer` | |
| `estimated_cost_usd` | `numeric` | |
| `reference_id` | `uuid` | FK to source record |
| `created_at` | `timestamptz` | |

### `imports`

Bulk lead CSV imports.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `organization_id` | `uuid` FK | |
| `uploaded_by` | `uuid` FK | |
| `file_path` | `text` | Supabase Storage path |
| `row_count` | `integer` | |
| `success_count` | `integer` | |
| `error_log` | `jsonb` | Row-level errors |
| `status` | `enum` | `processing`, `completed`, `failed` |
| `created_at` | `timestamptz` | |

---

## Row Level Security (RLS)

All tenant tables enable RLS with this pattern:

```sql
-- Example policy on leads
CREATE POLICY "org_isolation_select" ON leads
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );
```

| Role | Permissions |
|------|-------------|
| `owner` | Full CRUD on org data, billing, settings |
| `admin` | Full CRUD on leads, campaigns, content; no billing |
| `agent` | CRUD on assigned leads; read campaigns/scripts/content |

Service role key used only in server-side Next.js Route Handlers and Edge Functions—never exposed to client.

---

## Supabase Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `imports` | CSV lead uploads | Org-scoped via RLS policies |
| `avatars` | User profile images | Public read, owner write |
| `exports` | Dashboard CSV exports | Private, signed URLs |

---

## MVP Scope vs Post-MVP

| In MVP | Post-MVP |
|--------|----------|
| Single org per user | Multi-org, agency groups |
| Rules-based lead scoring | ML model + behavioral signals |
| Manual follow-up send (copy to WhatsApp) | WhatsApp Business API integration |
| Campaign enrollment + batch draft generation | Scheduled auto-send, A/B testing |
| SQL views for dashboard | Dedicated analytics pipeline |
| Soft-delete leads | Full audit log + GDPR export |

---

## Migration Order

1. `organizations`, `profiles`, `subscriptions`
2. `leads`, `lead_activities`
3. `lead_scores`
4. `follow_ups`, `ai_generation_logs`
5. `campaigns`, `campaign_leads`
6. `content_items`, `sales_scripts`
7. Dashboard views
8. RLS policies and indexes
9. Seed scripts (default sales scripts, demo data for staging)

---

## Estimated MVP Data Volume

| Entity | Per org/month (typical small agency) |
|--------|--------------------------------------|
| Leads | 200–500 |
| Activities | 1,000–3,000 |
| Follow-ups | 300–800 |
| AI logs | 500–1,500 |
| Content items | 20–50 |

Supabase free/pro tier is sufficient for first 50–100 paying tenants.
