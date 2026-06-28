# Desklabs Marketing Design System

Visual language for **public-facing pages only** (`/`, `/platform`, `/solutions`, `/contact`, `/company`, `/demo`, and future marketing routes).

Do **not** use inside the dashboard app shell.

## Import path

```tsx
import {
  MarketingPageShell,
  MarketingHeroSection,
  MarketingButton,
  marketingTokens,
} from "@/components/marketing/design-system";
```

Legacy imports from `@/components/marketing/marketing-section` and `@/components/marketing/marketing-footer` still work via re-exports.

---

## Design tokens

Location: `components/marketing/design-system/tokens/`

| Token file | Purpose |
|------------|---------|
| `colors.ts` | Primary (emerald), neutral (slate), accent, border, background, semantic |
| `typography.ts` | Display → Caption scale |
| `spacing.ts` | Section, hero, container, gap, scroll margin |
| `radius.ts` | Border radius + shadow presets |
| `animation.ts` | Fade, hover lift, reduced-motion rules |
| `grid.ts` | Responsive grid presets |

Aggregated object:

```tsx
import { marketingTokens } from "@/components/marketing/design-system";
```

### Typography scale

| Variant | Usage | Component |
|---------|-------|-----------|
| `display` | Large marketing headlines | `MarketingDisplay` |
| `h1` | Page hero titles | `MarketingH1` |
| `h2` | Section titles | `MarketingH2` |
| `h3` | Card / subsection titles | `MarketingH3` |
| `bodyLarge` | Hero subtitles, section descriptions | `MarketingBodyLarge` |
| `body` | Default paragraph | `MarketingBody` |
| `small` | Secondary copy | `MarketingSmall` |
| `caption` | Labels, hints | `MarketingCaption` |
| `eyebrow` | Section kicker (uppercase emerald) | `MarketingEyebrow` |

### Spacing (responsive)

| Context | Mobile | Tablet (`sm`) | Desktop (`lg`) |
|---------|--------|---------------|----------------|
| Section padding | `py-16` | `py-24` | `py-28` |
| Container padding | `px-4` | `px-6` | `px-8` |
| Max page width | `max-w-6xl` | — | — |
| Prose width | `max-w-3xl` | — | — |

### Colors

| Role | Tailwind | Notes |
|------|----------|-------|
| Primary | `emerald-700` | CTAs, eyebrows, links |
| Primary hover | `emerald-800` | Button hover |
| Accent (on dark) | `emerald-500` | Dark CTA sections |
| Neutral text | `slate-950` / `slate-600` | Headings / body |
| Border | `ring-slate-200/70` | Cards |
| Background | `white`, `slate-50/80`, `slate-950` | default / muted / dark |
| Success | `emerald-50` + `emerald-700` | Available badges |
| Warning | `amber-50` + `amber-700` | Beta badges |
| Danger | `red-50` + `red-700` | Form errors |

Contrast targets WCAG AA for body text on white backgrounds.

### Radius

| Token | Class |
|-------|-------|
| `sm` | `rounded-lg` |
| `md` | `rounded-xl` |
| `lg` | `rounded-2xl` |
| `xl` | `rounded-[1.5rem]` |

### Animation rules

1. **Prefer hover over entrance** — card lift on hover, not staggered page loads.
2. **Max ~2 animated elements per section** — e.g. one decorative pulse + one arrow bounce.
3. **No autoplay** except decorative backgrounds (`aria-hidden`).
4. **Respect `prefers-reduced-motion`** — `.marketing-site` disables motion in `globals.css`.

| Token | Usage |
|-------|-------|
| `hoverLift` | Interactive cards |
| `hoverScale` | Buttons |
| `bounceSlow` | Workflow arrows only |
| `pulseSlow` | Hero glow backgrounds only |

---

## Components

### Buttons

```tsx
<MarketingButton variant="primary">Coba Demo</MarketingButton>
<MarketingButton variant="secondary">Contact Sales</MarketingButton>
<MarketingButton variant="outline">Learn More</MarketingButton>
<MarketingButton variant="ghost">Cancel</MarketingButton>
<MarketingButton variant="link">View docs</MarketingButton>
```

| Variant | When to use |
|---------|-------------|
| `primary` | Main conversion action |
| `secondary` | Strong alternate action |
| `outline` | Secondary on light backgrounds |
| `ghost` | Tertiary / nav-adjacent |
| `link` | Inline text actions |

On dark CTA sections, pass `onDark` via `MarketingCtaSection` actions or use `marketingButtonVariants({ onDark: true })`.

Sizes: `sm`, `default`, `lg`.

### Badges

```tsx
<MarketingStatusBadge status="available" />
<MarketingStatusBadge status="coming_soon" />
<MarketingBadge variant="warning">Beta</MarketingBadge>
```

### Cards

| Component | Use case |
|-----------|----------|
| `MarketingPlatformCard` | Platform modules (Communication, AI, …) |
| `MarketingIndustryCard` | Solution packs with workflows + status |
| `MarketingFeatureCard` | Generic capability highlights |
| `MarketingStatCard` | Metrics / social proof numbers |
| `MarketingComparisonCard` | Single comparison column |
| `MarketingFaqCard` | FAQ entries (Pricing, Resources) |
| `MarketingCtaCard` | Mid-page conversion block |

All cards: white background, `ring-1 ring-slate-200/70`, `rounded-2xl`, optional `interactive` hover lift.

### Forms

Use on Contact, Demo, Careers, and future lead forms:

```tsx
<MarketingForm action={submitAction}>
  <MarketingFormField label="Email" htmlFor="email" required>
    <MarketingInput id="email" name="email" type="email" />
  </MarketingFormField>
  <MarketingFormField label="Message" htmlFor="message" error={errors.message}>
    <MarketingTextarea id="message" name="message" />
  </MarketingFormField>
  <MarketingButton type="submit">Kirim</MarketingButton>
</MarketingForm>
```

Shared class exports: `marketingInputClassName`, `marketingSelectClassName`, `marketingTextareaClassName`.

### Comparison

**Two-column narrative** (Traditional vs Desklabs):

```tsx
<MarketingComparisonBlock
  columns={[
    { title: "Traditional", items: ["…"], tone: "neutral" },
    { title: "Desklabs", items: ["…"], tone: "accent" },
  ]}
/>
```

**Feature matrix table** (Pricing tiers):

```tsx
<MarketingComparisonTable
  leftHeader="Starter"
  rightHeader="Enterprise"
  rows={[{ feature: "Seats", left: "5", right: "Unlimited" }]}
/>
```

### Grid

```tsx
<MarketingGrid variant="cards">{/* 1/2/3 col cards */}</MarketingGrid>
<MarketingGrid variant="metrics">{/* stat row */}</MarketingGrid>
<MarketingSplit reverse>{/* text + visual */}</MarketingSplit>
```

Variants: `cards`, `split`, `comparison`, `metrics`, `footer`.

### Icons

```tsx
<MarketingIcon icon={Plane} tone="accent" size="lg" />
<MarketingListMarker variant="dot" />
```

---

## Section components

Wrap every marketing page:

```tsx
<MarketingPageShell>
  <MarketingNavbar />
  <main>{/* sections */}</main>
  <MarketingDesignFooter />
</MarketingPageShell>
```

| Section | Purpose |
|---------|---------|
| `MarketingHeroSection` | Page hero with optional visual |
| `MarketingFeatureGridSection` | Header + grid slot |
| `MarketingWorkflowSection` | Horizontal/vertical flow steps |
| `MarketingTimelineSection` | Numbered story timeline |
| `MarketingComparisonSection` | Header + comparison slot |
| `MarketingMetricsSection` | Stats row |
| `MarketingTestimonialsSection` | Quote grid |
| `MarketingCtaSection` | Bottom conversion band |
| `MarketingSection` | Generic padded section |
| `MarketingSectionHeader` | Eyebrow + title + description |

### Example: new Pricing page

```tsx
import {
  MarketingPageShell,
  MarketingHeroSection,
  MarketingFeatureGridSection,
  MarketingGrid,
  MarketingFaqCard,
  MarketingCtaSection,
  MarketingButton,
  MarketingDesignFooter,
} from "@/components/marketing/design-system";

export function PricingPageView() {
  return (
    <MarketingPageShell>
      <MarketingNavbar />
      <main>
        <MarketingHeroSection
          eyebrow="Pricing"
          title="Plans that scale with your customer operations"
          description="…"
          align="center"
          actions={
            <>
              <MarketingButton size="lg">Coba Demo</MarketingButton>
              <MarketingButton variant="outline" size="lg">Contact Sales</MarketingButton>
            </>
          }
        />
        <MarketingFeatureGridSection title="Choose your plan" description="…">
          <MarketingGrid variant="cards">{/* plan cards */}</MarketingGrid>
        </MarketingFeatureGridSection>
        <MarketingCtaSection
          title="Need a custom rollout?"
          description="…"
          actions={[
            { label: "Coba Demo", href: "/demo", variant: "primary" },
            { label: "Hubungi Kami", href: "/contact", variant: "outline" },
          ]}
        />
      </main>
      <MarketingDesignFooter />
    </MarketingPageShell>
  );
}
```

---

## Responsive breakpoints

| Name | Min width | Typical layout |
|------|-----------|----------------|
| Mobile | `< 640px` | Single column, stacked CTAs |
| Tablet | `640px+` | 2-column grids |
| Desktop | `1024px+` | Split layouts, horizontal workflows |

---

## Accessibility checklist

- [ ] All interactive elements have visible `focus-visible:ring-2 ring-emerald-600`
- [ ] Form fields use `MarketingFormField` with `htmlFor` / `id`
- [ ] Errors use `role="alert"`
- [ ] Decorative motion has `aria-hidden`
- [ ] Button disabled states use native `disabled` attribute
- [ ] Body text uses `slate-600` minimum on white (not `slate-400` for paragraphs)

---

## File map

```
components/marketing/design-system/
├── tokens/           # Design tokens
├── typography.tsx
├── button.tsx
├── badge.tsx
├── cards.tsx
├── forms.tsx
├── comparison.tsx
├── grid.tsx
├── icon.tsx
├── sections.tsx      # Section layout primitives
├── footer.tsx
└── index.ts          # Public API
```

---

## Migration notes

Existing pages can migrate incrementally:

1. Wrap page in `MarketingPageShell`
2. Replace ad-hoc section padding with `MarketingSection`
3. Replace `buttonVariants` + emerald overrides with `MarketingButton`
4. Replace inline card classes with card components
5. Replace contact/demo form classes with `MarketingForm*` components

Dashboard components under `components/ui/` remain unchanged.
