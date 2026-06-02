# Xavira — Product Roadmap (MVP Focus)

Roadmap for launching Xavira as an AI Revenue Engine for Indonesian Umroh and Halal Tour travel agencies at **Rp500.000/month**.

---

## Vision

Help small and mid-size travel agencies convert more leads into booked Umroh and Halal Tour packages by combining CRM, AI-generated follow-ups, and sales enablement in one affordable SaaS product.

---

## Success Metrics (MVP)

| Metric | Target (90 days post-launch) |
|--------|------------------------------|
| Paying organizations | 20+ |
| Monthly churn | &lt; 8% |
| Leads managed per org/month | 150+ avg |
| Follow-ups generated per org/month | 100+ avg |
| Lead-to-qualified conversion lift | +15% vs baseline (self-reported) |
| Time to first follow-up | &lt; 24 hours after lead capture |
| NPS | ≥ 40 |

---

## Phase Overview

```
Phase 0 ──► Phase 1 (MVP) ──► Phase 2 (Growth) ──► Phase 3 (Scale)
Foundation    Core Revenue       Automation           Platform
2 weeks       6–8 weeks          8–10 weeks           Ongoing
```

---

## Phase 0: Foundation (Weeks 1–2)

**Goal:** Development environment, auth, and tenant model ready for feature work.

### Deliverables

- [ ] Next.js 15 project scaffold (App Router, Tailwind, shadcn/ui)
- [ ] Supabase project (staging + production)
- [ ] Database migrations: `organizations`, `profiles`, `subscriptions`
- [ ] Supabase Auth: email/password registration
- [ ] Middleware-protected dashboard shell
- [ ] Organization onboarding flow (agency name, business type, city)
- [ ] Role model: owner, admin, agent
- [ ] Basic settings page (org profile)

### Exit criteria

- New user can register, create org, and land on empty dashboard
- RLS verified: users cannot read other orgs' data

---

## Phase 1: MVP — Core Revenue Engine (Weeks 3–10)

**Goal:** Ship the minimum product that helps an agency capture leads, prioritize them, and send AI follow-ups via WhatsApp (manual copy).

This is the **launch-ready MVP**.

### Sprint 1 (Weeks 3–4): Lead Manager

- [ ] Lead CRUD (create, edit, soft-delete)
- [ ] Pipeline statuses: new → contacted → qualified → proposal_sent → negotiating → won/lost
- [ ] Lead list with filters (status, score tier, assigned agent, interest type)
- [ ] Lead detail page with notes
- [ ] Activity timeline (`lead_activities`)
- [ ] Agent assignment
- [ ] CSV import (basic: name, phone, source, interest)
- [ ] Phone deduplication warning

### Sprint 2 (Weeks 5–6): Lead Scoring

- [ ] Rules-based scoring engine (budget, urgency, source, engagement, status)
- [ ] Score badge on list and detail (cold / warm / hot)
- [ ] Auto-recalculate on lead update and status change
- [ ] Sort leads by score (default view)
- [ ] Scoring factor breakdown on lead detail

### Sprint 3 (Weeks 7–8): Follow Up Generator

- [ ] AI follow-up generation (Bahasa Indonesia, WhatsApp-first)
- [ ] Tone selection: friendly, professional, urgent
- [ ] Draft → edit → approve flow
- [ ] Copy to clipboard + WhatsApp deep link (`wa.me`)
- [ ] Mark as sent → update lead status to `contacted`
- [ ] AI usage logging and per-org daily limit
- [ ] OpenAI gateway (`/api/ai/follow-up`) with error handling

### Sprint 4 (Weeks 9–10): Dashboard + Sales Scripts + Polish

**Performance Dashboard (P1)**

- [ ] KPI cards: new leads, qualified, won, conversion rate, avg score
- [ ] 7-day and 30-day lead trend chart
- [ ] Pipeline funnel visualization
- [ ] Agent performance table (leads assigned, won)

**Sales Script Engine (P1)**

- [ ] Script library page
- [ ] 6–8 seeded Umroh/Halal Tour templates on org signup
- [ ] AI adapt script to lead context (side panel on lead detail)
- [ ] Custom script creation

**Launch polish**

- [ ] Mobile-responsive UI pass (agents on phones)
- [ ] Empty states and onboarding checklist
- [ ] Error boundaries and loading states
- [ ] Staging QA with 2–3 pilot agencies
- [ ] Landing page + waitlist or direct signup

### MVP feature scope (explicitly out)

| Deferred | Reason |
|----------|--------|
| Automated WhatsApp send | Requires WABA integration + Meta approval |
| Payment gateway | Manual invoicing for first 20 customers |
| Campaign auto-scheduling | Manual batch sufficient for MVP |
| Content Engine full workflow | Nice-to-have; scripts + follow-ups cover core |
| Multi-org per user | Complexity not needed for first customers |
| Google OAuth | Email auth sufficient for pilot |
| Team invite flow | Owner creates agent accounts manually in MVP |

### MVP launch checklist

- [ ] 3 pilot agencies onboarded and active
- [ ] Each pilot: 50+ leads, 30+ follow-ups generated
- [ ] No critical bugs in lead → score → follow-up flow
- [ ] Privacy policy and terms (Indonesia PDPA-aware)
- [ ] Support channel (WhatsApp group or email)

**Target launch:** End of Week 10

---

## Phase 2: Growth (Weeks 11–20)

**Goal:** Reduce manual work, enable self-serve billing, and deepen marketing tools for paying customers.

### Billing & subscriptions

- [ ] Midtrans or Xendit integration (Rp500.000/month)
- [ ] 14-day free trial
- [ ] Subscription gate on dashboard
- [ ] Invoice history in settings

### Campaign Engine (full lite → standard)

- [ ] Campaign CRUD with date ranges and promo templates
- [ ] Bulk enroll leads by filter (score, status, interest)
- [ ] Batch follow-up generation with progress UI
- [ ] Campaign performance: enrolled → contacted → converted

### Content Engine

- [ ] Generate Instagram, Facebook, WhatsApp broadcast copy
- [ ] Hashtag suggestions for Umroh/Halal Tour
- [ ] Content library with archive
- [ ] Pre-built promo templates (Ramadan, Haji season, Last seat)

### Team & collaboration

- [ ] Invite agents by email
- [ ] Role-based UI (agent vs admin)
- [ ] Supabase Realtime for live lead list updates

### Integrations

- [ ] Google OAuth signup
- [ ] Export leads and dashboard to CSV
- [ ] WhatsApp click-to-chat improvements (pre-filled message)

### AI enhancements

- [ ] AI lead summary on detail page
- [ ] Suggested next action ("Call within 2 hours — hot lead")
- [ ] Prompt tuning based on pilot feedback

---

## Phase 3: Scale (Weeks 21+)

**Goal:** Become the default revenue OS for Umroh/Halal Tour agencies in Indonesia.

### Automation

- [ ] WhatsApp Business API integration (send + delivery/read receipts)
- [ ] Scheduled follow-up sequences
- [ ] Meta Lead Ads import (Facebook/Instagram)
- [ ] Webhook/API for external CRM sync

### Advanced analytics

- [ ] Cohort analysis (leads by source × conversion)
- [ ] Revenue attribution by campaign
- [ ] Owner email weekly digest
- [ ] Benchmark vs anonymized industry averages

### Product expansion

- [ ] Package catalog module (Umroh tiers, pricing, seat inventory)
- [ ] Booking/deposit tracking (move beyond budget proxy)
- [ ] Customer post-booking follow-up (travel prep reminders)
- [ ] Multi-branch agencies

### Platform & enterprise

- [ ] Agency group / franchise dashboard
- [ ] White-label option for large travel networks
- [ ] API access for partners
- [ ] SLA tier at higher price point

---

## MVP User Journeys (Must Work at Launch)

### Journey 1: Agency owner onboarding

```
Sign up → Create org (Umroh agency, Jakarta) → See empty dashboard
→ Import 50 leads from CSV → See scored lead list → Assign agents
```

### Journey 2: Agent daily workflow

```
Open app on phone → Sort by hot leads → Open top lead
→ Read score breakdown → Generate WhatsApp follow-up
→ Edit message → Copy → Send via WhatsApp → Mark sent
→ Move status to qualified when prospect replies
```

### Journey 3: Owner checks performance

```
Open dashboard → See 12 new leads this week, 3 won
→ View funnel: 40% contacted, 18% qualified
→ Compare agent performance → Decide who needs coaching
```

---

## Pilot Program (Pre-Launch)

Recruit **3–5 Umroh/Halal Tour agencies** in Phase 1 Sprint 4.

| Week | Activity |
|------|----------|
| Week 8 | Recruit pilots (personal network, travel agent groups) |
| Week 9 | Onboard pilots, import real leads |
| Week 10 | Daily feedback, fix blockers |
| Week 11 | Convert pilots to paid (manual invoice) |

**Pilot criteria:**

- 5–20 agents
- Already using WhatsApp for sales
- Willing to import real lead data
- Umroh or Halal Tour as primary product

---

## Pricing & Packaging (MVP)

| Plan | Price | Includes |
|------|-------|----------|
| Starter | Rp500.000/month | 1 org, up to 5 agents, 100 AI generations/day, unlimited leads |
| Trial | Free 14 days | Full Starter (Phase 2) |

**MVP:** Single plan only. No tier complexity.

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenAI cost exceeds margin | High | Use gpt-4o-mini, daily caps, monitor `ai_generation_logs` |
| Agents won't adopt new tool | High | Mobile-first UX, WhatsApp copy-paste, pilot coaching |
| WhatsApp automation delayed | Medium | Manual send is acceptable for MVP; WABA in Phase 3 |
| Low payment conversion | Medium | Pilot proof ROI before billing; case studies |
| Lead data privacy concerns | Medium | RLS, clear privacy policy, no training on customer data |
| Seasonality (Umroh peaks) | Low | Launch before Ramadan prep season for maximum urgency |

---

## Team & Effort Estimate (MVP)

| Role | MVP involvement |
|------|-----------------|
| Full-stack developer | 1 FTE, 10 weeks |
| Product / founder | Part-time, pilot + GTM |
| Designer | Part-time, Weeks 1–2 + polish Week 10 |
| QA | Founder + pilots, Week 9–10 |

**Optional acceleration:** Second developer on Lead Manager + Dashboard in parallel (Sprints 1 & 4).

---

## Definition of Done: MVP

Xavira MVP is complete when:

1. A travel agency can **register and manage leads** in a shared pipeline.
2. Leads are **automatically scored** so agents know who to call first.
3. Agents can **generate and send AI follow-ups** in Bahasa Indonesia via WhatsApp (copy flow).
4. Owners can see **conversion metrics** on a performance dashboard.
5. Agents have access to **sales scripts** for common Umroh/Halal Tour objections.
6. **3+ pilot agencies** use the product weekly with real data.
7. System is **secure, multi-tenant, and stable** for production use.

Everything else in the PRD (full campaign automation, content engine depth, payment automation) ships in Phase 2 and beyond.

---

## Timeline Summary

| Milestone | Target |
|-----------|--------|
| Phase 0 complete | Week 2 |
| Lead Manager + Scoring | Week 6 |
| Follow Up Generator | Week 8 |
| MVP feature-complete | Week 10 |
| Pilot feedback incorporated | Week 11 |
| Public launch (manual billing) | Week 12 |
| Payment integration | Week 16 |
| WhatsApp API automation | Week 24+ |

---

## Next Steps

1. Review and approve `DATABASE.md` and `SYSTEM_ARCHITECTURE.md`
2. Set up Supabase project and run Phase 0 migrations
3. Recruit pilot agencies during Sprint 3
4. Begin Sprint 1: Lead Manager
