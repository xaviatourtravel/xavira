# Desklabs Information Architecture and Wireframes

## 1. Website role

The website is not a feature inventory. It must perform four jobs:

1. Define the category: customer operations platform for service businesses.
2. Demonstrate the product visually before asking visitors to believe claims.
3. Let each industry recognize its workflow without making the homepage feel vertical-specific.
4. Convert high-intent visitors into a trial or qualified demo.

## 2. Sitemap

```text
/
├── product/
│   ├── communication
│   ├── crm
│   ├── operations
│   ├── finance
│   ├── automation
│   ├── aurora-ai
│   ├── analytics
│   └── integrations
├── industries/
│   ├── travel
│   ├── education
│   ├── healthcare
│   ├── property
│   └── agency
├── pricing
├── customers
├── resources/
│   ├── blog
│   ├── guides
│   ├── templates
│   └── webinars
├── company/
│   ├── about
│   ├── contact
│   ├── partners
│   └── careers
├── security
├── privacy
├── terms
├── login
├── demo
└── en/ (localized mirror)
```

## 3. Homepage architecture

![Homepage flow](assets/homepage_flow.png)

### Global navigation

Desktop navigation should remain light and stable while the hero animates.

- Logo left
- Products
- Industries
- Resources
- Pricing
- Login
- Book demo (primary compact CTA)

Avoid mega-menus at launch. Use a two-column popover only when product and industry pages are ready.

### Hero wireframe

![Hero wireframe](assets/hero_wireframe.png)

**Desktop target height:** 820-920px.  
**Content width:** 1180-1240px.  
**Product mockup:** dominant visual, not a decorative screenshot.  
**CTA count:** two.  
**Floating callouts:** maximum four at once.

### Section 2: trust and proof

Use one of two launch-safe patterns:

- Real customer logos with permission; or
- Integration/technology ecosystem plus an honest development statement.

Do not create fake customer logos or unsupported percentages.

### Section 3: industries

Use a responsive five-card layout. On desktop, show three primary verticals above and two below or use a horizontal carousel with clear controls. Each card contains:

- Industry name
- One-line operational promise
- One product visual or workflow detail
- A deep-link CTA

No generic stock photography unless paired with a real Desklabs UI overlay.

### Section 4: common problems

Use three or four alternating problem/solution rows inspired by the reference rhythm:

- Product visual left, copy right
- Copy left, product visual right
- Repeat

Each row communicates one problem, one consequence, and one Desklabs response.

### Section 5: platform overview

![Platform architecture](assets/platform_architecture.png)

Show the shared core, then explain vertical operating templates. This section resolves the question: “How can one platform serve several industries without becoming generic?”

### Section 6: product modules

Use a dark or high-contrast band only once, as a narrative shift. The module grid should show six capabilities:

- Communication
- CRM
- Operations
- Finance
- Automation
- Aurora AI

Each item receives a short outcome statement, not a feature list.

### Section 7: Aurora AI

Use a product scene rather than abstract AI imagery. Show the sequence:

Customer message → extracted intent → missing data → suggested next action → human approval.

### Section 8: how it works

Use five numbered steps on desktop and a vertical sequence on mobile. Keep the visual to one coherent product scene that changes across steps.

### Section 9: proof

Use customer stories, quantified outcomes, or operational before/after evidence. If proof is limited, show founder/customer interviews and implementation stories instead of inflated numbers.

### Section 10: pricing

Keep pricing concise. If packaging is not final, publish a “starting from” model and a transparent plan-comparison philosophy rather than invented detail.

### Section 11: FAQ and final CTA

FAQ addresses integration, onboarding, migration, AI control, security, industries, and pricing. The final CTA repeats only the two primary actions.

## 4. Responsive architecture

### Desktop ≥ 1280px

- Maximum content width 1240px
- Hero product visual occupies 60-70% of the lower hero
- Industry cards can use 3+2 grid
- Alternating problem rows remain two-column

### Laptop 1024-1279px

- Reduce floating callouts to two or three
- Preserve product visual readability
- Product grids use two columns
- Navigation may collapse Resources into menu

### Tablet 768-1023px

- Hero copy remains centered
- Mockup uses 92% viewport width
- Problem rows stack while preserving visual-first order
- Industry section becomes horizontal snap carousel or two-column grid

### Mobile < 768px

- Navigation becomes drawer
- Hero headline 42-48px maximum
- One CTA row, then secondary text link if space is constrained
- Product mockup uses a cropped mobile-safe composition, not a scaled desktop screenshot
- Disable nonessential floating cards
- Sections use 64-80px vertical padding
- Motion changes from parallax to simple opacity/translate

## 5. Page templates

### Product page

Hero → proof → workflow animation → capability details → integrations → use cases → CTA.

### Industry page

Hero → industry pain → lifecycle workflow → relevant modules → Aurora use cases → migration/onboarding → proof → CTA.

### Customer story

Company context → operational problem → implementation → workflow screenshots → outcomes → quote → related industry CTA.

### Pricing page

Plan philosophy → plan cards → usage dimensions → add-ons → FAQ → demo CTA.

## 6. Navigation behavior

- Header transparent over initial hero, becoming white with subtle border after scroll.
- Sticky behavior must not reduce mobile viewport excessively.
- Active nav state uses typography and subtle underline, not a filled tab.
- The Book Demo button remains visible on desktop.
- Login is text or quiet button.

## 7. Conversion paths

### Self-serve visitor

Homepage → Product/industry page → Pricing → Start free.

### Sales-assisted visitor

Homepage → Industry page → Demo → qualification form → calendar.

### Research visitor

Homepage → Resources/customer story → retargeting or newsletter → demo later.

## 8. Forms

Demo form should request only:

- Name
- Work email
- Company
- Industry
- Team size
- Primary challenge

Phone/WhatsApp may be optional at first step. More detailed qualification belongs after submission or calendar selection.
