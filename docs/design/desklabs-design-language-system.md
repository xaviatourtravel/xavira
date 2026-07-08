# Desklabs Design Language System

**Version:** 1.0  
**Owner:** Product / Design  
**Status:** Draft  
**Last Updated:** 2026-07-08

---

# 01. Purpose

This document defines the visual language of Desklabs across the marketing website, product interface, documentation, demo screens, and future product surfaces.

This is not a component inventory.

This is the design philosophy behind how Desklabs should look, feel, and behave.

The goal is simple:

> Every Desklabs surface should feel calm, connected, operational, and premium.

---

# 02. Design Personality

Desklabs should feel like:

- calm software
- serious but approachable
- operational, not decorative
- AI-assisted, not AI-chaotic
- modern SaaS, not enterprise bloat
- premium, but not flashy

Desklabs should not feel like:

- a generic CRM
- a noisy admin dashboard
- a template marketplace landing page
- an over-animated AI startup
- an enterprise tool full of jargon

---

# 03. Core Visual Principles

## Calm First

Every screen should reduce cognitive load.

Use whitespace, typography, and hierarchy before adding decoration.

If a screen feels busy, remove before adding.

---

## Context Over Chrome

The UI should highlight the customer, conversation, workflow, and next action.

Borders, shadows, badges, and icons should never compete with user context.

---

## Operational Clarity

Desklabs is used to run real work.

Every design decision must make work easier to understand, faster to complete, or safer to operate.

---

## Progressive Disclosure

Show the essential first.

Hide complexity until it is needed.

Long lists, advanced settings, metadata, and secondary actions should be expandable or placed behind clear controls.

---

## AI as Partner

AI should feel present, useful, and calm.

AI UI should not scream.

AI states should explain what the system knows, what it recommends, and what still needs human judgment.

---

# 04. Layout Philosophy

Desklabs layouts should use structured workspaces.

Common patterns:

## Marketing Website

- centered content
- strong vertical storytelling
- generous whitespace
- focused sections
- product visuals that support the narrative

## App Workspace

- sidebar navigation
- context list or table
- primary work area
- optional inspector/context panel

## Editor Workspace

- compact two-column layout on desktop
- single-column on mobile
- repeating lists collapsed after 5 items
- actions near the content they affect

---

# 05. Grid & Width

## Marketing Website

Recommended max widths:

- content text: 640–760px
- section container: 1120–1200px
- large product visual: 960–1120px

Avoid full-width text blocks.

---

## App

Recommended workspace patterns:

- navigation: fixed
- list column: 300–360px
- main content: flexible
- inspector: 380–420px

Primary work content should always receive the strongest emphasis.

---

## Forms / Editors

Use compact desktop layouts.

Avoid one huge vertical column unless the form is very simple.

For dense forms, use:

- left column for core content
- right column for metadata, schedules, prices, FAQ, or status

---

# 06. Spacing System

Use an 8-point rhythm.

Preferred values:

- 4px — icon gaps, tiny internal spacing
- 8px — compact spacing
- 12px — tight form rhythm
- 16px — default content gap
- 24px — section internal spacing
- 32px — major section gap
- 48px — page section gap
- 64px+ — marketing section separation

Avoid arbitrary spacing unless there is a clear reason.

---

# 07. Typography

Desklabs should use fewer typography levels.

Preferred hierarchy:

## Marketing

- Hero title
- Section title
- Body
- Caption / eyebrow

## Product App

- Page title
- Section title
- Body
- Metadata

Avoid too many font sizes.

Avoid excessive bold.

Use bold only to create useful hierarchy.

---

# 08. Copy & UI Text

Desklabs copy should be simple and human.

Use words like:

- conversation
- customer
- workflow
- knowledge
- payment
- context
- workspace
- AI
- next action

Avoid generic enterprise phrases like:

- digital transformation
- end-to-end ecosystem
- intelligent synergy
- omnichannel engagement solution
- hyper automation

Good copy:

> Semua percakapan customer dalam satu tempat.

Weak copy:

> Omnichannel customer engagement platform.

---

# 09. Color Philosophy

Desklabs should use color sparingly.

## Primary

Used for:

- primary CTA
- active state
- important action
- brand emphasis

## Navy / Dark

Used for:

- strong surfaces
- outgoing messages
- premium contrast
- final CTA sections

## Green

Used for:

- success
- confirmation
- positive status
- brand accent

## Muted Gray

Used for:

- metadata
- secondary text
- dividers
- quiet surfaces

Do not overuse badges or bright status colors.

---

# 10. Border Philosophy

Every border must earn its place.

Use borders for:

- separating dense operational areas
- defining form fields
- grouping related content

Avoid:

- nested cards
- heavy outlines
- card inside card inside card
- bordered sections with too much empty space

When possible, use whitespace instead of borders.

---

# 11. Radius

Desklabs should feel soft but not playful.

Recommended radius:

- small controls: 8px
- inputs and buttons: 10–12px
- cards: 16px
- large panels: 20–24px
- chat bubbles: 16–22px with subtle asymmetry when appropriate

Avoid overly round “toy-like” surfaces.

---

# 12. Shadow Philosophy

Shadows should be subtle.

Use shadows to create elevation, not decoration.

Preferred:

- soft shadows on floating panels
- minimal shadow on cards
- no heavy glow unless used in dark CTA sections

Avoid aggressive drop shadows.

---

# 13. Cards

Cards should support clarity.

Cards should not be the default wrapper for everything.

Use cards when:

- content belongs together
- comparison is needed
- a section needs separation from the background

Avoid cards when:

- a divider or whitespace is enough
- the content is already inside a structured workspace
- it creates extra scrolling

---

# 14. Tables & Lists

Lists should remain calm and scannable.

Rules:

- show maximum 5 items by default for long lists
- use expand/collapse for the rest
- avoid rendering dozens of items upfront
- keep row height compact
- show metadata as secondary text

Expandable list copy:

ID:
- Lihat {count} lainnya
- Sembunyikan

EN:
- Show {count} more
- Show less

---

# 15. Forms

Forms should be compact, readable, and grouped by intent.

Rules:

- labels above inputs
- helper text only when useful
- validation close to field
- avoid excessive full-width fields
- use two-column layout where it improves scanability
- group related fields into compact sections

Never make users scroll through huge empty cards.

---

# 16. Buttons

Button hierarchy:

1. Primary
2. Secondary
3. Ghost
4. Text
5. Icon-only

Rules:

- one primary action per section
- primary button should be obvious
- destructive actions should be separated visually
- disabled states must be clear
- icon-only buttons need accessible labels

---

# 17. Badges

Badges communicate status, not decoration.

Use badges for:

- status
- mode
- count
- priority

Avoid badge walls.

Maximum 2 badges in one row unless there is a strong reason.

---

# 18. Empty States

Every empty state should include:

- icon or subtle illustration
- short title
- helpful explanation
- action if available

Do not use:

- “No data”
- blank panels
- awkward empty white boxes

Good:

> Belum ada FAQ  
> Tambahkan FAQ agar AI bisa menjawab pertanyaan customer dengan lebih konsisten.

---

# 19. Loading States

Prefer skeletons over spinners.

Rules:

- preserve final layout height
- avoid layout shifts
- keep loading quiet
- never block the whole page unless necessary

---

# 20. Motion

Motion should explain change.

Recommended timing:

- hover: 120ms
- small transition: 150ms
- panel/drawer: 180–220ms
- modal: 200ms
- page transition: 200ms

Use opacity and transform.

Avoid animating layout-heavy properties unless needed.

Respect reduced motion preferences.

---

# 21. Icons

Icons should support recognition.

Rules:

- use a consistent icon family
- keep stroke weight consistent
- avoid decorative icons
- icon-only controls need labels
- do not overuse icons in dense interfaces

---

# 22. Product Screenshots

Product screenshots are a major brand asset.

Rules:

- show real workflows, not empty UI
- include realistic customer names and data
- show AI, context, and action together
- avoid screenshots that are too tiny to read
- highlight the “aha” moment

Good screenshot composition:

- left: customer/conversation
- center: workflow
- right: AI/context/next action

---

# 23. Marketing Website Style

Marketing pages should feel:

- spacious
- focused
- product-led
- narrative-driven

Every section should answer one question:

- What problem exists?
- Why does it matter?
- How does Desklabs solve it?
- What can the visitor do next?

Avoid long feature grids without narrative.

---

# 24. Homepage Rules

Homepage should prioritize:

1. Clear category
2. Pain
3. Product visual
4. Core platform
5. AI
6. Business Brain
7. Workflow
8. Trust
9. CTA

The homepage should sell a new way of working, not just a list of modules.

---

# 25. AI UI States

AI should communicate:

- what it knows
- what it recommends
- what is missing
- what action the user can take

AI state examples:

- AI recommends
- Suggested reply
- Missing knowledge
- Next best action
- Ready for human
- Needs more context

AI UI should stay calm.

Avoid flashy “AI magic” visuals that reduce trust.

---

# 26. Business Brain UI

Business Brain should feel like the place where the business teaches Desklabs.

Rules:

- compact editor layout
- two-column desktop layout
- expandable lists after 5 items
- parser previews should be clear
- warnings should be helpful, not scary
- documents and AI instructions should be easy to reach
- FAQ lists should not push important sections far down

Business Brain copy should emphasize:

> Teach your business to AI.

---

# 27. Inbox UI

Inbox is the primary product experience.

Rules:

- conversation first
- chat as visual hero
- AI Copilot always available
- auto-reply controls must not disable Copilot
- message bubbles must stay readable
- focus mode should improve concentration
- inspector supports context but does not compete

Inbox should feel like:

- WhatsApp Desktop familiarity
- Intercom clarity
- Linear calmness
- Desklabs operational intelligence

---

# 28. Inspector Pattern

Inspector is context, not dashboard.

Rules:

- one hero block maximum
- flat sections
- property rows
- dividers over nested cards
- no badge walls
- no duplicate information already visible in main content

Common inspector tabs:

- AI Copilot
- Customer 360
- Resources
- History

---

# 29. Landing Page CTA

CTA copy should be human and direct.

Preferred:

- Coba Demo
- Book Live Demo
- Lihat Platform
- Hubungi Kami
- Mulai Workspace

Avoid:

- Submit
- Learn More everywhere
- Request Enterprise Solution

---

# 30. Visual Don’ts

Do not:

- make everything full width
- use giant empty cards
- show 30 list items at once
- overuse badges
- overuse borders
- bury important sections under long lists
- make AI look disabled when only auto-reply is off
- use abstract jargon without explanation
- prioritize decoration over operational clarity

---

# 31. Definition of Done

A Desklabs screen is visually ready when:

- it follows the spacing system
- it has one clear primary action
- important information is visible without excessive scrolling
- long lists are collapsed
- repeated components use the same style
- empty/loading/error states are handled
- copy is simple and human
- it works in light and dark mode
- it feels connected to the rest of Desklabs

---

# 32. North Star

The best Desklabs interface should make users feel:

> Akhirnya semua kerjaan customer ada di satu tempat.

Or in English:

> Finally, every customer workflow lives in one place.
