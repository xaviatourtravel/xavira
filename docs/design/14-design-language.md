# 14 --- Design Language

**Status:** Draft\
**Owner:** Product\
**Version:** 1.0

------------------------------------------------------------------------

# Purpose

This document defines the visual language for every Desklabs screen.

It is **not** a UI guideline for one page.

It is the design contract shared by Product, Design, Engineering, and
AI.

Every new screen should feel like it belongs to the same product.

------------------------------------------------------------------------

# Design Philosophy

## Calm Workspace

The interface should reduce mental load.

Software should disappear behind the user's work.

Prefer whitespace over decoration.

------------------------------------------------------------------------

## Conversation First

Communication is the core workflow.

Every surrounding element exists to support the conversation.

Never compete with the chat.

------------------------------------------------------------------------

## Progressive Disclosure

Show only what is needed now.

Reveal detail only when the user asks for it.

Avoid overwhelming first-time users.

------------------------------------------------------------------------

## One Question Per Surface

Each section answers one question only.

Examples:

  Surface        Question
  -------------- ------------------------
  AI Copilot     What should I do next?
  Customer 360   Who is this customer?
  Resources      What can I send?
  History        What happened?

------------------------------------------------------------------------

# Layout System

Use a consistent multi-column workspace.

-   Navigation
-   Workspace List
-   Primary Content
-   Inspector

The primary content must always receive the greatest visual emphasis.

------------------------------------------------------------------------

# 8pt Spacing System

Allowed spacing values:

-   4 (icons only)
-   8
-   16
-   24
-   32
-   48
-   64

Avoid arbitrary spacing.

------------------------------------------------------------------------

# Border Philosophy

Every border must earn its place.

If whitespace solves the problem, remove the border.

Prefer: - section dividers - subtle separators

Avoid: - nested cards - box inside box - thick outlines

------------------------------------------------------------------------

# Radius

Use consistent radius.

-   Small: 8px
-   Default: 12px
-   Large: 16px

Avoid mixed radii.

------------------------------------------------------------------------

# Typography

Only four levels:

## Display

Page titles.

## Section

Panel titles.

## Body

Primary reading.

## Caption

Metadata.

Avoid excessive bold text.

------------------------------------------------------------------------

# Color

Primary color exists only for actions.

Muted colors communicate metadata.

Success, warning and danger are reserved for meaningful events.

------------------------------------------------------------------------

# Buttons

Hierarchy:

1.  Primary
2.  Secondary
3.  Ghost
4.  Text

Never show more than one primary button in the same visual group.

------------------------------------------------------------------------

# Forms

Every form follows:

Label

↓

Input

↓

Help text (optional)

↓

Validation

Do not stack multiple unrelated inputs into dense blocks.

------------------------------------------------------------------------

# Property Lists

Preferred format:

Destination Japan

Departure September

Budget Unknown

Avoid stacked label/value cards.

------------------------------------------------------------------------

# Empty States

Every empty state includes:

-   icon
-   title
-   short explanation
-   action (when applicable)

Never display blank panels.

------------------------------------------------------------------------

# Loading

Prefer skeleton loaders.

Avoid blocking spinners except for full-page loading.

------------------------------------------------------------------------

# Badges

Badges communicate status only.

Maximum: 2 badges per row.

Avoid badge overload.

------------------------------------------------------------------------

# Timeline

Timeline is the default pattern for history.

Structure:

-   Today
-   Yesterday
-   Older

Each item:

-   timestamp
-   title
-   description

Avoid card-based timelines.

------------------------------------------------------------------------

# Inspector Pattern

Inspector is contextual information.

Not a dashboard.

Rules:

-   flat sections
-   dividers
-   property rows
-   minimal hero block
-   no nested cards

------------------------------------------------------------------------

# Cards

Cards are exceptional.

Do not wrap every section in a card.

Use cards only when grouping creates clarity.

------------------------------------------------------------------------

# Motion

Duration:

150--200ms

Subtle easing.

Never animate for decoration.

------------------------------------------------------------------------

# Icons

Icons support recognition.

Never use decorative icons without meaning.

Lucide is the standard icon set.

------------------------------------------------------------------------

# Tables

Tables are for operational data.

Not for summaries.

Use generous spacing.

Sticky headers where appropriate.

------------------------------------------------------------------------

# Responsive

Design targets:

-   1280
-   1440
-   1600
-   1920

No broken hierarchy across widths.

------------------------------------------------------------------------

# Accessibility

Minimum contrast: WCAG AA.

All icon-only buttons require aria-label.

Keyboard navigation must work.

Visible focus state is required.

------------------------------------------------------------------------

# Internationalization

Every UI string uses i18n.

Supported:

-   Bahasa Indonesia
-   English

Never hardcode visible UI copy.

------------------------------------------------------------------------

# Definition of Done

A screen is complete only if:

-   Uses shared spacing scale
-   Uses shared typography
-   Uses shared button hierarchy
-   Uses shared inspector pattern
-   Uses shared empty states
-   Uses shared loading states
-   Supports light & dark mode
-   Supports Indonesian & English
-   Passes accessibility checks
-   Feels visually consistent with the rest of Desklabs
