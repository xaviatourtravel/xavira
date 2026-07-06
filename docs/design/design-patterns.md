# Design Patterns

**Status:** Stable\
**Version:** 1.0\
**Owner:** Product Design\
**Last Updated:** 2026-07-06\
**Applies To:** All Desklabs Workspaces

------------------------------------------------------------------------

# Purpose

Design Patterns define reusable interaction and layout solutions across
Desklabs.

Components define **what** to build.

Patterns define **how those components work together**.

------------------------------------------------------------------------

# Principles

-   Patterns solve recurring problems.
-   Every workspace should reuse existing patterns before inventing new
    ones.
-   Consistency is more valuable than novelty.

------------------------------------------------------------------------

# Pattern Catalog

## 1. Workspace Pattern

Used for:

-   Inbox
-   Business Brain
-   CRM
-   Finance

Structure:

``` text
Workspace Header

↓

Primary Content

↓

Inspector (optional)

↓

Contextual Actions
```

------------------------------------------------------------------------

## 2. Inspector Pattern

Purpose:

Support decisions, not display raw data.

Rules:

-   Maximum one hero card
-   Flat sections
-   Property lists by default
-   No nested cards
-   No nested scrollbars
-   Sticky header when appropriate

------------------------------------------------------------------------

## 3. Hero Pattern

Purpose:

Surface the single most important piece of information.

Rules:

-   One hero per workspace
-   Action-oriented
-   Never used for decoration

Examples:

-   AI Recommendation
-   Business Brain Health
-   Booking Status

------------------------------------------------------------------------

## 4. Property List Pattern

Display structured information as key/value pairs.

Example:

``` text
Destination      Japan
Budget           Unknown
Passengers       4
```

Preferred over stacked cards.

------------------------------------------------------------------------

## 5. Timeline Pattern

Used for:

-   Conversation history
-   CRM history
-   Activity

Rules:

-   Chronological
-   Group by date
-   Compact rows
-   Avoid card layouts

------------------------------------------------------------------------

## 6. Recommendation Pattern

Every recommendation includes:

-   Title
-   Reason
-   Expected impact
-   Primary action

Recommendations must always explain *why*.

------------------------------------------------------------------------

## 7. Empty State Pattern

Always include:

-   Icon
-   Title
-   Helpful description
-   Primary CTA (when appropriate)

Empty states should teach the product.

------------------------------------------------------------------------

## 8. Loading Pattern

Prefer skeletons over spinners.

Loading should preserve layout stability.

------------------------------------------------------------------------

## 9. Split Workspace Pattern

Used when users need simultaneous context.

Example:

Conversation \| Inspector

Rules:

-   Primary work on the left
-   Context on the right
-   Never compete for attention

------------------------------------------------------------------------

# Anti-Patterns

Avoid:

-   Nested cards
-   Nested accordions
-   Excessive borders
-   More than one primary CTA per section
-   Dashboards inside inspectors

------------------------------------------------------------------------

# Pattern Selection Guide

  Goal                   Pattern
  ---------------------- ----------------
  Guide a decision       Inspector
  Show current status    Hero
  Show structured data   Property List
  Show history           Timeline
  Offer an action        Recommendation
  No data available      Empty State

------------------------------------------------------------------------

# Evolution

New patterns should be introduced only through an approved RFC.

Existing patterns should be extended before creating new ones.
