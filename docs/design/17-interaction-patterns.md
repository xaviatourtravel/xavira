# 17 --- Interaction Patterns

**Status:** Draft\
**Owner:** Product\
**Version:** 1.0

------------------------------------------------------------------------

# Purpose

Interaction Patterns define how users interact with Desklabs.

Visual consistency is important.

Behavior consistency is mandatory.

Every interaction should feel predictable, responsive, and calm.

------------------------------------------------------------------------

# Principles

-   Motion explains change.
-   Feedback is immediate.
-   Users never lose context.
-   Actions should feel reversible where possible.
-   The interface should always communicate its current state.

------------------------------------------------------------------------

# Interaction States

Every interactive component supports:

-   Default
-   Hover
-   Focus
-   Active
-   Disabled
-   Loading
-   Success
-   Error

Never skip a state.

------------------------------------------------------------------------

# Hover

Purpose: Reveal affordance, not information.

Rules:

-   Duration: 120ms
-   Subtle background or border change
-   Never move layout

Avoid hover-only actions for critical workflows.

------------------------------------------------------------------------

# Focus

Keyboard users must always know where they are.

Rules:

-   Visible focus ring
-   High contrast
-   Consistent across components

------------------------------------------------------------------------

# Click

Clicks should provide immediate feedback.

Use:

-   pressed state
-   ripple-free interaction
-   subtle animation

------------------------------------------------------------------------

# Selection

Selected items remain visually stable.

Use:

-   soft tinted background
-   left accent if appropriate
-   consistent highlight color

Avoid dramatic animations.

------------------------------------------------------------------------

# Loading

Prefer skeletons over spinners.

Use spinners only when:

-   no layout exists yet
-   blocking operation

Preserve layout during loading.

------------------------------------------------------------------------

# Saving

Inline saving states:

Saving...

Saved

Failed

Avoid blocking overlays.

------------------------------------------------------------------------

# Success

Keep success feedback concise.

Examples:

-   Saved.
-   Published.
-   Assigned.
-   Message sent.

Avoid celebratory animations.

------------------------------------------------------------------------

# Error

Explain:

-   what happened
-   what users can do next

Never expose raw server errors.

------------------------------------------------------------------------

# Empty States

Always include:

-   icon
-   title
-   explanation
-   action (if applicable)

Teach the user what to do next.

------------------------------------------------------------------------

# Toasts

Purpose:

Confirm lightweight actions.

Rules:

-   Auto dismiss
-   Short copy
-   Never block workflow

------------------------------------------------------------------------

# Dialogs

Use dialogs only for:

-   destructive confirmation
-   focused forms
-   important decisions

Avoid dialog chains.

------------------------------------------------------------------------

# Drawers

Preferred for contextual editing.

Desktop: Right-side sheet.

Mobile: Bottom sheet.

------------------------------------------------------------------------

# Keyboard

Support:

-   Tab
-   Shift+Tab
-   Enter
-   Escape
-   Arrow navigation where applicable

Future: Command palette shortcuts.

------------------------------------------------------------------------

# Realtime

Realtime updates should:

-   preserve scroll
-   preserve focus
-   never interrupt typing

Notify subtly.

------------------------------------------------------------------------

# Motion

Duration:

Hover: 120ms

Small transition: 150ms

Panel transition: 180ms

Page transition: 200ms

Avoid bounce effects.

------------------------------------------------------------------------

# Drag & Drop

Show:

-   clear drop target
-   insertion indicator
-   cancel state

Never surprise users.

------------------------------------------------------------------------

# Accessibility

All interactions support:

-   keyboard
-   screen readers
-   visible focus
-   WCAG AA contrast

------------------------------------------------------------------------

# Internationalization

All interaction copy uses i18n.

Supported:

-   Bahasa Indonesia
-   English

------------------------------------------------------------------------

# Definition of Done

An interaction is complete when it:

-   provides immediate feedback
-   preserves context
-   follows shared motion rules
-   supports accessibility
-   behaves consistently across all workspaces
