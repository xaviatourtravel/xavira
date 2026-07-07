# 15 --- Inspector Pattern

**Status:** Draft\
**Owner:** Product\
**Version:** 1.0

------------------------------------------------------------------------

# Purpose

The Inspector is the contextual panel that appears on the right side of
a workspace.

It is **not** a dashboard. It is **not** a second page.

Its job is to answer the user's questions without pulling focus away
from the main workspace.

------------------------------------------------------------------------

# Core Principle

Main Workspace = Do the work.

Inspector = Understand the work.

The inspector must never compete with the primary content.

------------------------------------------------------------------------

# Standard Layout

1.  Tab Navigation
2.  Hero Block (optional, max one)
3.  Section List
4.  Footer Actions (optional)

Avoid nested cards and nested scrolling.

------------------------------------------------------------------------

# Tabs

Every inspector should expose only the contexts relevant to the page.

Examples:

Inbox - AI Copilot - Customer 360 - Resources - History

CRM - Overview - Activity - Notes - Files

Booking - Summary - Travelers - Payments - Timeline

------------------------------------------------------------------------

# Hero Block

Rules:

-   Maximum one hero block
-   Most important insight only
-   One primary action

Examples:

AI Confidence: 98%

Lead Ready

Payment Overdue

Never stack hero cards.

------------------------------------------------------------------------

# Sections

Each section answers exactly one question.

Recommended order:

1.  Identity
2.  Current Status
3.  Context
4.  Actions
5.  Metadata

------------------------------------------------------------------------

# Property Rows

Preferred pattern:

Destination Japan

Departure September

Passengers 4

Budget Unknown

Do not stack labels vertically.

------------------------------------------------------------------------

# Actions

Primary action:

Maximum one.

Secondary actions:

Ghost or text buttons.

Never display more than three actions together.

------------------------------------------------------------------------

# Empty States

Always provide:

-   icon
-   title
-   explanation

Never leave blank space.

------------------------------------------------------------------------

# Loading

Use skeleton rows matching the final layout.

Avoid large centered spinners.

------------------------------------------------------------------------

# Timeline Pattern

History uses a timeline.

Structure:

Today

Yesterday

Older

Each event:

Time

Title

Description

------------------------------------------------------------------------

# Resources Pattern

Display in order:

Recommended

Products

Documents

Media

Keep previews compact.

------------------------------------------------------------------------

# AI Copilot Pattern

Order:

1.  Recommendation
2.  Suggested Reply
3.  Next Best Action
4.  Missing Information

Technical metadata should remain hidden.

------------------------------------------------------------------------

# Customer 360 Pattern

Order:

Identity

Intent

Missing Information

CRM Details

Quick Actions

------------------------------------------------------------------------

# Responsive

Inspector width:

400--420px desktop.

On smaller screens:

Collapse into a drawer.

------------------------------------------------------------------------

# Accessibility

Keyboard accessible tabs.

Visible focus state.

ARIA labels for icon-only buttons.

------------------------------------------------------------------------

# Internationalization

All labels use i18n.

Support:

-   Bahasa Indonesia
-   English

No hardcoded UI strings.

------------------------------------------------------------------------

# Definition of Done

An inspector is complete when:

-   It supports one clear mental model.
-   It never distracts from the main workspace.
-   It uses shared property rows.
-   It uses shared spacing and typography.
-   It supports light and dark mode.
-   It supports Indonesian and English.
