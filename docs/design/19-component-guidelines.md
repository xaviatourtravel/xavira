# 19 --- Component Guidelines

**Status:** Draft\
**Owner:** Product\
**Version:** 1.0

------------------------------------------------------------------------

# Purpose

This document defines how reusable UI components should behave and
appear across Desklabs.

Components are the building blocks of every workspace.

A component should never be redesigned differently for each module.

------------------------------------------------------------------------

# Principles

-   Reuse before creating new
-   Behavior is as important as appearance
-   Components are predictable
-   Components inherit Design Tokens
-   Components inherit Interaction Patterns

------------------------------------------------------------------------

# Button

Hierarchy:

1.  Primary
2.  Secondary
3.  Ghost
4.  Text
5.  Icon-only

Rules:

-   One primary action per surface
-   Loading state preserves width
-   Disabled state clearly visible

------------------------------------------------------------------------

# Input

Structure:

Label

↓

Field

↓

Helper Text

↓

Validation

Rules:

-   Clear focus state
-   Consistent height
-   Inline validation

------------------------------------------------------------------------

# Select

Use searchable select when more than 10 options exist.

Support keyboard navigation.

------------------------------------------------------------------------

# Textarea

Auto-expand where appropriate.

Never resize unexpectedly.

------------------------------------------------------------------------

# Badge

Badges indicate status only.

Avoid decorative badges.

Maximum two badges in one row.

------------------------------------------------------------------------

# Card

Cards group related information.

Do not wrap everything in cards.

Prefer flat sections where possible.

------------------------------------------------------------------------

# Property Row

Preferred format for metadata.

Example:

Destination Japan

Departure 24 Sept 2026

Budget Unknown

------------------------------------------------------------------------

# Timeline

Used for:

-   History
-   Activity
-   Audit logs

Structure:

Time

Title

Description

------------------------------------------------------------------------

# Tabs

Keep labels concise.

Avoid more than six visible tabs.

Support keyboard navigation.

------------------------------------------------------------------------

# Dialog

Use for:

-   Confirmation
-   Focused forms
-   Destructive actions

Avoid nested dialogs.

------------------------------------------------------------------------

# Drawer / Sheet

Use for contextual editing.

Desktop: Right sheet

Mobile: Bottom sheet

------------------------------------------------------------------------

# Empty State

Every empty state includes:

-   Icon
-   Title
-   Description
-   Action

------------------------------------------------------------------------

# Skeleton

Skeletons mirror final layout.

Never use generic gray blocks.

------------------------------------------------------------------------

# Toast

Purpose:

Confirm lightweight actions.

Auto-dismiss.

Do not interrupt workflow.

------------------------------------------------------------------------

# Table

Used for operational data.

Features:

-   Sticky header
-   Comfortable spacing
-   Responsive overflow

------------------------------------------------------------------------

# Inspector

Always follows the shared Inspector Pattern.

Never becomes a dashboard.

------------------------------------------------------------------------

# Accessibility

Every component supports:

-   Keyboard
-   Screen readers
-   Visible focus
-   WCAG AA

------------------------------------------------------------------------

# Internationalization

All visible strings use i18n.

No hardcoded copy.

------------------------------------------------------------------------

# Definition of Done

A component is complete when it:

-   Uses Design Tokens
-   Uses Interaction Patterns
-   Supports light & dark mode
-   Supports Indonesian & English
-   Is reusable across all workspaces
