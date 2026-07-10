# Desklabs Website Cursor Prompt Pack

Use one prompt per PR. Do not ask Cursor to “build the full website” in one run.

---

## PR-WEB-001 - Marketing foundation

```text
Create the Desklabs marketing website foundation using Next.js App Router, TypeScript, Tailwind, and the existing repository conventions.

Scope:
- Marketing route group
- MarketingHeader
- MarketingFooter
- SectionShell
- Container and typography primitives
- Marketing design tokens
- Indonesian homepage route placeholder
- English locale route placeholder

Do not build final homepage sections yet.
Do not modify the Desklabs application workspace.
Do not add GSAP, Lenis, WebGL, or a CMS in this PR.

Use the Website Bible files as the source of truth.
Run lint, typecheck, and build.
Return changed files, summary, verification, and commit.
```

## PR-WEB-002 - Static homepage narrative

```text
Implement the complete static Indonesian homepage structure from the Website Bible.

Sections:
- Header
- Hero copy and static product scene placeholder
- Trust
- Industries
- Problems
- Platform
- Product modules
- Aurora AI
- How it works
- Proof
- Pricing transition
- FAQ
- Final CTA
- Footer

No complex motion.
No fabricated logos, statistics, testimonials, or product capabilities.
Use reusable data-driven components.
Do not touch the application routes.
Run lint, typecheck, and build.
```

## PR-WEB-003 - Hero product scene

```text
Build the Desklabs hero product scene using original Desklabs UI assets and the Website Bible hero wireframe.

Requirements:
- Product-led desktop workspace
- Maximum four floating callouts
- Neutral cross-industry data
- Static first frame renders without JavaScript
- Responsive tablet/mobile compositions
- No copied reference assets or exact layout
- No continuous distracting loop

Implement only the hero scene and supporting components.
```

## PR-WEB-004 - Motion foundation

```text
Add the marketing motion foundation using Framer Motion.

Implement:
- MotionProvider with reduced-motion support
- shared duration/easing tokens
- section reveal primitive
- stagger primitive
- visibility pause behavior

Do not animate all sections yet.
Do not add GSAP or Lenis.
Keep performance budget documented in the Website Bible.
```

## PR-WEB-005 - Hero motion

```text
Implement the 8-second hero motion storyboard from the Website Bible.

Sequence:
- background glow
- copy reveal
- product workspace entrance
- inbound conversation
- intent extraction
- Aurora suggestion
- workflow update
- calm resting state

Play once, then settle.
Implement reduced-motion final state.
Preserve static SSR first frame.
```

## PR-WEB-006 - Industry section

```text
Build the five-industry section: Travel, Education, Healthcare, Property, and Agency.

Use original Desklabs product visuals.
Each card must include outcome copy, one workflow cue, and a deep-link.
Healthcare copy must remain non-clinical and compliance-safe.
Responsive behavior must match the Website Bible.
```

## PR-WEB-007 - Problem/solution stories

```text
Implement four alternating problem/solution rows using the Website Bible.

Each row:
- one operational problem
- one consequence
- one Desklabs product response
- one original product scene
- restrained scroll-triggered state change

Do not add generic feature cards.
```

## PR-WEB-008 - Platform and product modules

```text
Implement the shared platform core section and six product module summaries.

The page must explain how one platform supports multiple industries through vertical workflow templates.
Use a single high-contrast section, original diagrams, and concise copy.
```

## PR-WEB-009 - Aurora AI story

```text
Implement the Aurora AI section with a human-in-the-loop workflow.

Show:
conversation -> extraction -> missing information -> suggestion -> human approval.

Do not imply autonomous sending or unsupported intelligence.
No robot/brain illustrations.
Use original Desklabs UI.
```

## PR-WEB-010 - Conversion pages

```text
Implement /demo, /pricing, and the first /industries/travel page using the Website Bible templates.

No fake pricing details or proof.
Connect form submission only to an approved internal endpoint.
Add analytics events according to the analytics taxonomy.
```

## PR-WEB-011 - English localization

```text
Add the English locale route and content using the approved English copy deck.

Requirements:
- hreflang
- canonical tags
- locale-aware navigation
- shared content components
- no text embedded in images
```

## PR-WEB-012 - Performance and launch QA

```text
Perform the final website performance, accessibility, SEO, analytics, and responsive audit.

Use the Website Bible QA checklist.
Do not redesign sections.
Document every issue fixed and any remaining risk.
Run Lighthouse or equivalent checks for representative pages.
```
