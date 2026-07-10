# Desklabs Visual Asset Production Brief

## 1. Asset philosophy

The reference succeeds because product visuals do most of the selling. Desklabs should use the same principle while producing entirely original product scenes, copy, illustrations, and motion.

Target ratio on homepage:

- 65-75% product/UI visual storytelling
- 15-25% typography and diagrams
- 0-15% real photography

## 2. Required launch assets

### Hero product scene

One master desktop composition at 2880×1800 source resolution.

Must show:

- Global navigation or application rail
- Communication workspace
- Customer context
- Aurora suggestion or insight
- One industry workflow update

Create variants:

- Travel data
- Education data
- Property data
- Neutral cross-industry data

### Floating callouts

Prepare 10 independent components:

1. New inquiry
2. AI extracted intent
3. Follow-up due
4. Assignment changed
5. Appointment/booking created
6. Payment received
7. Document requested
8. Workflow stage updated
9. Customer sentiment/temperature
10. KPI change

Each component exported as:

- Figma component
- PNG @2x with transparency for fallback
- SVG if vector-safe
- Motion specification or JSON state map

### Industry cards

Five original compositions:

- Travel
- Education
- Healthcare
- Property
- Agency

Use real Desklabs UI overlays. Photography, if used, should depict work context rather than generic smiling teams.

### Problem/solution visuals

Four before/after scenes:

1. Scattered communication → unified workspace
2. Spreadsheet handoff → structured workflow
3. Forgotten follow-up → automated task/next action
4. Missing context → customer timeline

### Product module scenes

- Communication
- CRM
- Operations
- Finance
- Automation
- Aurora AI
- Analytics (optional launch)

### Aurora AI sequence

Create a five-state storyboard:

1. Conversation arrives
2. Intent extracted
3. Missing information identified
4. Suggested response prepared
5. Human approves

## 3. Screenshot rules

- Never use raw production screenshots without curation.
- Replace sensitive information with realistic fictional data.
- Maintain consistent avatar style and timestamps.
- Use believable Indonesian names and companies for Indonesian pages.
- Avoid unrealistic perfect datasets; include ordinary operational states.
- Crop to the task being explained.
- Do not show unavailable functionality.

## 4. UI mockup treatment

- Radius 20-28px for large browser frames
- Border 1px at 6-8% black
- Shadow: soft, wide, low opacity; marketing only
- Background: off-white or pale blue/indigo glow
- Browser chrome simplified; do not imitate a specific browser brand
- Use a consistent 16:10 master aspect ratio

## 5. Illustration language

Use clean geometric compositions made from:

- Product cards
- channel icons
- avatars
- workflow nodes
- status chips
- subtle lines and dotted fields

Avoid:

- cartoon mascots at launch
- generic 3D people
- excessive glassmorphism
- random decorative blobs
- stock AI brains and robots

## 6. Iconography

- Use one outline family for navigation/product icons.
- Stroke 1.5-1.75px.
- Marketing icons may use small brand-color fills.
- Channel logos remain official and must follow brand guidelines.
- Do not recolor partner logos without permission.

## 7. Photography

Photography is optional. If used:

- Prefer documentary-style real work environments.
- Show service interactions, not staged corporate handshakes.
- Add product overlays only when they remain readable.
- Secure commercial usage rights and model releases.

## 8. Export matrix

| Asset | Desktop | Tablet | Mobile | Retina |
|---|---:|---:|---:|---:|
| Hero scene | 1600×1000 | 1200×900 | 750×900 crop | @2x source |
| Industry image | 720×480 | 600×420 | 640×420 | @2x |
| Product scene | 1440×900 | 1000×760 | 720×760 crop | @2x |
| Testimonial portrait | 160×160 | 160×160 | 128×128 | @2x |
| Social preview | 1200×630 | - | - | fixed |

Export AVIF/WebP for raster delivery and retain Figma source.

## 9. Naming convention

```text
marketing_<page>_<section>_<industry>_<state>_<size>.<ext>
```

Example:

```text
marketing_home_hero_neutral_ai-approved_desktop.avif
```

## 10. Source-of-truth folder

```text
/design/marketing
├── 00_foundations
├── 01_homepage
├── 02_product
├── 03_industries
├── 04_motion
├── 05_social
└── 99_archive
```

## 11. Reference guardrail

Adopt from the supplied reference:

- product-led composition
- narrative sequence
- restrained gradients
- alternating problem rows
- platform ecosystem visual
- strong second-half CTA

Do not copy:

- exact hero composition
- exact text, labels, or feature arrangement
- brand-specific purple palette
- illustration assets
- animation choreography frame-for-frame
- logos or customer proof
