# Desklabs Component Guidelines

Version: 1.0
Owner: Product & Design

---

# Purpose

This document defines when and how UI components should be used across Desklabs.

The goal is consistency.

Engineers should not invent new UI patterns when an existing one already solves the problem.

---

# 1. Core Principle

Choose the simplest component that clearly communicates the task.

Hierarchy:

1. Content
2. Context
3. Action
4. Decoration

Decoration should never dominate.

---

# 2. Cards

Use cards only when grouping related information.

Use cards for:
- Dashboard summaries
- KPI widgets
- Standalone content blocks

Avoid cards for:
- Every form field
- Nested sections
- Chat messages
- Long editors

Prefer whitespace + dividers before adding another card.

---

# 3. Forms

Desktop:
- Two-column layout whenever practical
- Related fields grouped together
- Labels above inputs

Mobile:
- Single column

Never create long uninterrupted forms.

---

# 4. Expandable Lists

Any repeating list longer than 5 items must collapse by default.

Applies to:
- FAQ
- Knowledge
- Products
- Documents
- Highlights
- Included / Excluded
- Departure schedules
- Prices
- Validation issues

Default:
- Show first 5
- "Show X more"
- "Show less"

---

# 5. Tables

Use tables when comparison matters.

Good:
- CRM
- Finance
- Bookings

Avoid tables for:
- Chat
- Documents
- FAQ
- Settings

---

# 6. Lists

Use lists when browsing.

Each row should contain:

- Primary information
- Secondary metadata
- One clear status
- Optional quick actions

Avoid badge overload.

---

# 7. Inspector

Inspector is contextual.

Rules:
- Max 4 tabs
- Flat layout
- Property rows
- Minimal cards
- One hero section only

Default tabs:
- AI Copilot
- Customer 360
- Resources
- History

---

# 8. Modals vs Drawers

Modal:
- Confirmation
- Small forms
- Dangerous actions

Drawer:
- Editing
- Preview
- Secondary workflows

Never place long forms inside a modal.

---

# 9. Tabs

Use tabs for related views.

Maximum:
6 visible tabs.

If more:
Use overflow.

Tabs should not become navigation menus.

---

# 10. Buttons

One primary button per section.

Order:

Primary
Secondary
Ghost
Text
Icon

Destructive buttons should be visually separated.

---

# 11. Search

Search belongs at the top of collections.

Always debounce expensive searches.

Use placeholder examples instead of generic "Search".

---

# 12. Status

Prefer status dots over colorful badges.

Examples:

● Active
● Waiting
● Closed

Reserve badges for counts or important labels.

---

# 13. Empty States

Must include:

- title
- explanation
- CTA

No blank pages.

---

# 14. Loading

Use skeletons whenever layout is known.

Avoid fullscreen spinners.

---

# 15. AI Components

Every AI block should answer:

- What happened?
- Why?
- What should I do?

Standard blocks:

- AI Recommendation
- Suggested Reply
- Missing Knowledge
- Confidence
- Sources Used
- Next Best Action

AI should never feel mysterious.

---

# 16. Chat Components

Conversation is the hero.

Rules:

- Readable bubbles
- Comfortable line length
- One date separator per day
- Compact composer
- Hover actions only if they don't distract
- AI Auto Reply and AI Copilot are separate concepts

---

# 17. Business Brain

Editors should be compact.

Rules:

- Two-column layout
- Parser import
- Expandable sections
- Documents easy to reach
- AI Instructions never buried below long FAQs

---

# 18. Navigation

Sidebar:
- Stable order
- Minimal nesting
- No duplicate items

Page header:
- One title
- One description
- Primary action on the right

---

# 19. Responsive Rules

Desktop:
- Max content width
- Two-column editors

Tablet:
- Reduce side panels

Mobile:
- Single column
- Bottom actions when appropriate

---

# 20. Definition of Done

A component is complete when:

- Uses existing patterns
- Works in light & dark mode
- Has loading, empty, error states
- Responsive
- Accessible
- Reusable
- Documented

---

# Golden Rule

If a new component cannot be reused in at least three places, question whether it should exist at all.
