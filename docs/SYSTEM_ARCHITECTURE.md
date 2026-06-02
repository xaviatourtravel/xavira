# Xavira — System Architecture (MVP)

This document describes the technical architecture for Xavira MVP: an AI-powered revenue engine for Indonesian Umroh and Halal Tour travel agencies.

---

## Architecture Goals

1. **Ship fast** — Monolithic Next.js app with Supabase backend; no microservices in MVP.
2. **Tenant-safe** — Strict organization isolation at database and application layers.
3. **AI cost-aware** — Centralized OpenAI gateway with logging, rate limits, and caching where possible.
4. **Mobile-friendly** — Agents work primarily on phones; UI must be responsive and copy-paste friendly for WhatsApp.
5. **Indonesia-ready** — Bahasa Indonesia defaults, IDR, WIB timezone, phone-first UX.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│              Next.js 15 App Router + React + shadcn/ui           │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel (Hosting)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Server       │  │ Route        │  │ Server Actions /       │  │
│  │ Components   │  │ Handlers     │  │ Mutations              │  │
│  └──────────────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────────────────────────┼─────────────────────┼───────────────┘
                              │                     │
          ┌───────────────────┼─────────────────────┼───────────────┐
          ▼                   ▼                     ▼               ▼
   ┌─────────────┐    ┌─────────────┐      ┌─────────────┐  ┌───────────┐
   │  Supabase   │    │  Supabase   │      │   OpenAI    │  │  Payment  │
   │  Auth       │    │  PostgreSQL │      │   API       │  │  Gateway  │
   │             │    │  + RLS      │      │             │  │ (Phase 2) │
   └─────────────┘    │  Storage    │      └─────────────┘  └───────────┘
                      │  Realtime   │
                      └─────────────┘
```

---

## Tech Stack

| Layer | Technology | Role |
|-------|------------|------|
| Frontend | Next.js 15 (App Router) | SSR, routing, API boundary |
| UI | Tailwind CSS + shadcn/ui | Component library, design system |
| Auth | Supabase Auth | Email/password + magic link (MVP) |
| Database | Supabase PostgreSQL | Primary data store |
| File storage | Supabase Storage | CSV imports, exports |
| AI | OpenAI API (`gpt-4o-mini` default) | Follow-ups, content, scripts |
| Hosting | Vercel | Frontend + serverless functions |
| Monitoring | Vercel Analytics + Supabase logs | MVP observability |

---

## Application Structure

```
xavira/
├── app/
│   ├── (auth)/              # Login, register, forgot password
│   ├── (dashboard)/         # Authenticated app shell
│   │   ├── leads/           # Lead Manager
│   │   ├── follow-ups/      # Follow Up Generator
│   │   ├── campaigns/       # Campaign Engine (lite)
│   │   ├── content/         # Content Engine (lite)
│   │   ├── scripts/         # Sales Script Engine
│   │   ├── dashboard/       # Performance Dashboard
│   │   └── settings/        # Org profile, team, billing
│   └── api/
│       ├── ai/              # OpenAI proxy endpoints
│       ├── webhooks/        # Payment webhooks (Phase 2)
│       └── cron/            # Scheduled jobs (Phase 2)
├── components/              # Shared UI (shadcn + domain)
├── lib/
│   ├── supabase/            # Client, server, middleware helpers
│   ├── ai/                  # Prompt templates, OpenAI client
│   ├── scoring/             # Lead scoring rules engine
│   └── validations/         # Zod schemas
├── types/                   # Shared TypeScript types
└── supabase/
    └── migrations/          # SQL migrations
```

---

## Module Architecture

### 1. Lead Manager

**Purpose:** Capture, organize, and track Umroh/Halal Tour prospects through a sales pipeline.

| Concern | Implementation |
|---------|----------------|
| List & filter | Server Component fetch with Supabase query + URL search params |
| Detail view | Lead profile + activity timeline (`lead_activities`) |
| Create/edit | Server Actions with Zod validation |
| Assignment | Dropdown of org agents; updates `assigned_to` |
| Import | CSV upload → Storage → background parse → bulk insert |
| Dedup | Warn on matching `phone` within same org |

**Key flows:**

```
Agent adds lead → scoring job triggered → dashboard metrics update
Agent changes status → activity logged → score may recalculate
```

---

### 2. Lead Scoring

**Purpose:** Prioritize hot leads so agents focus on bookings most likely to close.

| Concern | Implementation |
|---------|----------------|
| Trigger | On lead create/update, status change, new activity |
| Engine | Rules-based scorer in `lib/scoring` (sync, &lt;50ms) |
| Storage | Upsert `lead_scores`; log in `lead_activities` |
| Display | Score badge + tier color on lead list and detail |
| Sort | Default list sort: score DESC, then `created_at` DESC |

**MVP:** No OpenAI call for scoring. Optional AI "insight" sentence post-MVP.

```
Lead data changed
      │
      ▼
Rules Engine (budget, urgency, source, engagement, status)
      │
      ▼
Score 0–100 → Tier (cold/warm/hot) → Persist → UI refresh
```

---

### 3. Follow Up Generator

**Purpose:** Generate personalized Bahasa Indonesia follow-up messages agents copy to WhatsApp.

| Concern | Implementation |
|---------|----------------|
| Input | Lead context + tone + channel + optional campaign template |
| Generation | `POST /api/ai/follow-up` → OpenAI → save `follow_ups` |
| Edit | Agent edits `final_body` before marking sent |
| Send | MVP: "Copy to clipboard" + deep link `wa.me/{phone}` |
| Log | `lead_activities` entry on generate and on send |

**AI gateway safeguards:**

- Per-org daily token budget (configurable in `organizations.settings`)
- Prompt templates versioned in code
- All calls logged to `ai_generation_logs`
- Server-side only; API key never in client

**Prompt context (serialized lead snapshot):**

- Name, interest type, package, budget, travel date, party size
- Last 3 activities
- Current score/tier
- Organization brand name and tone settings

---

### 4. Campaign Engine (MVP-lite)

**Purpose:** Group leads around seasonal promos (Ramadan Umroh, Lebaran packages) and batch-generate follow-ups.

| Concern | Implementation |
|---------|----------------|
| Create campaign | Name, dates, target interest, base message template |
| Enroll leads | Filter by score tier, status, interest → bulk add to `campaign_leads` |
| Execute | "Generate follow-ups for all enrolled" → queue AI calls with concurrency limit |
| Track | Campaign dashboard: enrolled, contacted, converted counts |

**MVP limitation:** No scheduled auto-send. Agents review drafts individually.

---

### 5. Content Engine (MVP-lite)

**Purpose:** Generate Instagram/WhatsApp marketing copy for Umroh and Halal Tour promos.

| Concern | Implementation |
|---------|----------------|
| Generate | Form: content type, platform, topic, tone → OpenAI |
| Store | Save to `content_items` |
| Use | Copy button + optional hashtag copy |
| Templates | Pre-built prompts for "Early bird", "Testimonial style", "Last seat" |

---

### 6. Sales Script Engine

**Purpose:** Give agents structured responses for common objections in Indonesian travel sales.

| Concern | Implementation |
|---------|----------------|
| Library | List system templates + org custom scripts |
| Generate | AI adapts template to specific lead context |
| Use | Side panel on lead detail view during calls/chat |
| Seed | Auto-create default scripts on org registration |

**Default scenarios (seeded):**

- First WhatsApp reply
- "Harga terlalu mahal"
- "Saya bandingin dengan travel lain"
- "Belum ada paspor"
- Closing: DP dan jadwal keberangkatan
- Follow-up after no reply (3 days)

---

### 7. Performance Dashboard

**Purpose:** Show agency owners whether Xavira is driving revenue outcomes.

| Concern | Implementation |
|---------|----------------|
| KPI cards | New leads, qualified, won, conversion rate, avg score |
| Charts | Leads over time (7/30 days), funnel by status |
| Agent view | Leads handled and won per agent |
| Export | CSV download via Storage signed URL |

**MVP:** SQL views queried on page load. No separate BI tool.

---

## Authentication & Authorization

```
Request → Middleware (Supabase session refresh)
        → Route check: authenticated?
        → Load profile + organization_id
        → RLS enforces data scope in Supabase
        → Role check in Server Actions for admin-only ops
```

| Route group | Access |
|-------------|--------|
| `(auth)` | Public |
| `(dashboard)/*` | Authenticated + active subscription |
| `/api/ai/*` | Authenticated + rate limit |
| `/api/webhooks/*` | Signature verification (Phase 2) |

**MVP auth methods:** Email + password. Google OAuth as fast follow.

---

## Data Flow: New Lead to Follow-Up

```
1. Agent creates lead (Server Action)
2. Insert leads + lead_activities (status: new)
3. Scoring engine computes score → lead_scores
4. Dashboard view reflects new lead (on next load)
5. Agent opens lead → clicks "Generate Follow-Up"
6. API route builds prompt → OpenAI → follow_ups (draft)
7. Agent edits → copies → opens WhatsApp → marks sent
8. follow_ups.status = sent, lead.status = contacted
9. lead_activities logged, score recalculated
10. Dashboard metrics update
```

---

## AI Service Layer

Central module: `lib/ai/`

| Function | Model | Avg tokens | Use case |
|----------|-------|------------|----------|
| `generateFollowUp` | gpt-4o-mini | ~800 | Personalized messages |
| `generateContent` | gpt-4o-mini | ~600 | Social/broadcast copy |
| `adaptSalesScript` | gpt-4o-mini | ~500 | Contextual script variant |
| `summarizeLead` | gpt-4o-mini | ~300 | Post-MVP insight blurb |

**Rate limits (MVP defaults per org):**

- 100 AI generations/day
- 3 concurrent requests max

**Error handling:**

- OpenAI timeout → retry once → graceful error toast
- Budget exceeded → block with upgrade message
- Log all failures to `ai_generation_logs`

---

## Supabase Integration Patterns

| Pattern | Usage |
|---------|--------|
| Server Component + `createServerClient` | Read-heavy pages (lists, dashboard) |
| Server Actions | Mutations (create lead, update status) |
| Route Handlers | AI calls, webhooks, file processing |
| Realtime (optional MVP) | Live lead list updates for teams |
| Storage | CSV import/export |

**Middleware:** `middleware.ts` refreshes session and protects `(dashboard)` routes.

---

## External Integrations

### MVP

| Integration | Status | Notes |
|-------------|--------|-------|
| OpenAI | Required | Core AI features |
| WhatsApp | Manual | Copy-paste + `wa.me` links |
| Email | Manual | Copy-paste (no SMTP in MVP) |

### Phase 2

| Integration | Purpose |
|-------------|---------|
| Midtrans / Xendit | Rp500.000/month subscription billing |
| WhatsApp Business API | Automated send + delivery status |
| Google OAuth | Faster signup |
| Meta Lead Ads | Auto-import leads from Facebook/Instagram |

---

## Deployment Architecture

```
GitHub repo → Vercel (preview + production)
           → Supabase project (staging + production)
           → Environment variables per environment
```

**Environment variables:**

| Variable | Scope |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only |
| `OPENAI_API_KEY` | Server only |

**Environments:**

| Env | Purpose |
|-----|---------|
| `development` | Local + Supabase local or dev project |
| `staging` | Pre-release QA with seed data |
| `production` | Paying customers |

---

## Security Considerations

1. **RLS on every tenant table** — No query without org scope.
2. **Service role isolation** — Used only in trusted server code paths.
3. **Input validation** — Zod on all Server Actions and API routes.
4. **AI prompt injection** — Sanitize user-provided notes before inclusion in prompts; system prompt instructs model to ignore override attempts.
5. **PII handling** — Phone numbers masked in logs; no PII in client-side analytics.
6. **CSRF** — Next.js Server Actions built-in protection.

---

## Performance Targets (MVP)

| Metric | Target |
|--------|--------|
| Dashboard load | &lt; 2s (P95) |
| Lead list (50 rows) | &lt; 1.5s |
| Lead scoring | &lt; 100ms |
| AI generation | &lt; 8s (depends on OpenAI) |
| Uptime | 99.5% (Vercel + Supabase SLA) |

---

## Observability

| Signal | Tool |
|--------|------|
| Errors | Vercel error tracking |
| AI usage | `ai_generation_logs` + daily org summary |
| DB performance | Supabase dashboard |
| User actions | `lead_activities` (product analytics proxy) |

Post-MVP: Sentry, PostHog, or similar.

---

## Scalability Path

MVP architecture supports ~100–500 tenants without structural changes.

| Bottleneck | Scale trigger | Solution |
|------------|---------------|----------|
| Dashboard queries | &gt;500ms P95 | Materialized views, Redis cache |
| AI throughput | Rate limits hit often | Queue (Inngest / Supabase Edge Functions) |
| File imports | Large CSVs | Background job queue |
| Multi-region | Customers outside ID | Supabase read replicas |

---

## MVP Module Priority

| Priority | Module | MVP depth |
|----------|--------|-----------|
| P0 | Auth + org setup | Full |
| P0 | Lead Manager | Full |
| P0 | Lead Scoring | Rules engine |
| P0 | Follow Up Generator | Full (manual send) |
| P1 | Performance Dashboard | Core KPIs + funnel |
| P1 | Sales Script Engine | Library + AI adapt |
| P2 | Campaign Engine | Lite (enroll + batch draft) |
| P2 | Content Engine | Lite (generate + copy) |
| P3 | Billing automation | Manual invoicing in MVP |

This prioritization ensures the product delivers measurable revenue impact (lead capture → prioritization → follow-up) before marketing automation depth.
