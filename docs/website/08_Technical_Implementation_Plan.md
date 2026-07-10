# Desklabs Website Technical Implementation Plan

## 1. Recommended stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- Framer Motion for component/section motion
- Lenis only if smooth scrolling passes accessibility and performance tests
- GSAP only for sequences that cannot be expressed cleanly with Framer Motion
- Content source: MDX or headless CMS
- Vercel deployment
- Image optimization using Next/Image and AVIF/WebP

Avoid React Three Fiber for launch unless a validated design requires it. The reference quality can be achieved with DOM, SVG, and restrained motion at a lower performance cost.

## 2. Route structure

```text
app/
├── (marketing)/
│   ├── page.tsx
│   ├── product/[slug]/page.tsx
│   ├── industries/[slug]/page.tsx
│   ├── pricing/page.tsx
│   ├── customers/[slug]/page.tsx
│   └── resources/[...slug]/page.tsx
├── demo/page.tsx
├── login/...
└── api/...
```

## 3. Component architecture

```text
components/marketing/
├── layout/
│   ├── MarketingHeader
│   ├── MarketingFooter
│   └── SectionShell
├── hero/
│   ├── HeroCopy
│   ├── HeroProductScene
│   └── HeroCallout
├── industries/
├── problems/
├── platform/
├── product-scenes/
├── aurora/
├── proof/
├── pricing/
└── shared/
```

Separate marketing components from the application design system. Share base tokens and brand primitives, not dense app-layout components.

## 4. Content architecture

Content objects should describe sections while JSX owns complex animation.

Example:

```ts
interface IndustryPageContent {
  slug: string;
  name: string;
  hero: HeroContent;
  pains: PainItem[];
  workflow: WorkflowStep[];
  modules: ProductModuleRef[];
  aiUseCases: AIUseCase[];
  proof?: CustomerStoryRef[];
  faq: FAQItem[];
  seo: SEOFields;
}
```

## 5. Motion architecture

- Use a `MotionProvider` for reduced-motion state.
- Define duration/easing tokens in one file.
- Lazy-load below-fold animation modules.
- Avoid hydration mismatch from viewport-dependent initial states.
- Use CSS for hover and small feedback.
- Use Framer Motion for entrance, orchestration, and state transitions.

## 6. Performance budget

Target mobile, p75:

- LCP < 2.5s
- INP < 200ms
- CLS < 0.1
- Initial JS < 180KB compressed where achievable
- Hero media < 700KB initial payload
- Total homepage transfer < 2MB initial load

Guardrails:

- Do not preload every product asset.
- Serve static first frame before motion JavaScript loads.
- Use responsive image sizes.
- Defer customer logos/testimonial media.
- Font subset and preload only required weights.

## 7. Accessibility

- Semantic heading order
- Keyboard-accessible navigation and accordions
- Visible focus states
- Minimum target size 44px mobile
- Color contrast WCAG AA
- Alt text for explanatory images; empty alt for decoration
- Captions/transcript for product demo
- Reduced-motion support
- No critical information conveyed by motion alone

## 8. Localization

Recommended:

- `/` Indonesian
- `/en` English
- shared content schema with locale variants
- `hreflang` and canonical tags
- no text embedded in raster assets
- allow copy expansion of 20-30%

## 9. Forms and CRM handoff

Demo flow:

1. Minimal form
2. Server-side validation
3. Spam protection
4. Store lead and campaign metadata
5. Redirect to calendar or qualification page
6. Send confirmation
7. Create internal follow-up task

Do not expose third-party form endpoints directly in the browser when avoidable.

## 10. Delivery phases

### Phase 0: foundation

Tokens, layout shell, header/footer, typography, CMS schema, analytics plan.

### Phase 1: homepage static

All sections implemented without complex motion. Validate copy, rhythm, and responsiveness.

### Phase 2: hero and product motion

Hero sequence, problem rows, platform ecosystem, Aurora sequence.

### Phase 3: conversion routes

Demo, pricing, product pages, Travel industry page.

### Phase 4: content and additional verticals

Agency, Education, Property; Healthcare after readiness.

### Phase 5: optimization

Performance, experiments, SEO content, proof and customer stories.

## 11. Definition of done

- Design parity approved at desktop, laptop, tablet, mobile
- Content approved in both languages where published
- Core Web Vitals budget met
- Analytics verified
- Forms tested end-to-end
- Metadata/schema validated
- Accessibility audit complete
- Reduced-motion verified
- Legal pages published
- No false product or customer claims
