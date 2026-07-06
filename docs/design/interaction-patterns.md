# Interaction Patterns

**Status:** Stable\
**Version:** 1.0\
**Owner:** Product Design\
**Last Updated:** 2026-07-06\
**Applies To:** All Desklabs Workspaces

------------------------------------------------------------------------

# Purpose

Interaction Patterns define how users interact with the interface.

Visual consistency is important.

Behavior consistency is mandatory.

------------------------------------------------------------------------

# Core Principles

-   Every interaction should feel predictable.
-   Motion should explain change, never decorate it.
-   Users should never lose context.
-   Optimistic updates are preferred where safe.

------------------------------------------------------------------------

# Hover

Use hover only to indicate available actions.

Never hide critical information behind hover.

Duration: 120ms

------------------------------------------------------------------------

# Focus

Every interactive element must have a visible focus state.

Keyboard users should never lose track of focus.

------------------------------------------------------------------------

# Selection

Selected items should remain visually stable.

Do not animate layout shifts when selecting.

------------------------------------------------------------------------

# Loading

Preferred:

-   Skeletons
-   Placeholder content

Avoid:

-   Infinite spinners
-   Layout jumping

------------------------------------------------------------------------

# Saving

Saving should happen inline.

States:

-   Saving...
-   Saved
-   Failed

Never block the entire page unless necessary.

------------------------------------------------------------------------

# Empty States

Every empty state should include:

-   Icon
-   Title
-   Helpful explanation
-   CTA (if applicable)

------------------------------------------------------------------------

# Errors

Errors should:

-   Explain what happened
-   Explain how to recover
-   Preserve user input

Never show raw system errors to end users.

------------------------------------------------------------------------

# Confirmation

Only require confirmation for destructive actions.

Avoid unnecessary confirmation dialogs.

Prefer Undo where possible.

------------------------------------------------------------------------

# Optimistic Updates

Use optimistic UI for:

-   Status changes
-   Labels
-   Notes
-   Assignment

Rollback automatically if the server rejects the update.

------------------------------------------------------------------------

# Realtime

Realtime updates should:

-   Preserve scroll position
-   Preserve user focus
-   Never interrupt typing

Show subtle indicators instead of disruptive notifications.

------------------------------------------------------------------------

# Motion

Default duration:

-   Hover: 120ms
-   Fade: 150ms
-   Panel transition: 150ms

Avoid bounce and exaggerated easing.

------------------------------------------------------------------------

# Keyboard

Support:

-   Tab navigation
-   Arrow navigation (lists/tabs)
-   Escape to close overlays
-   Enter to confirm primary actions

------------------------------------------------------------------------

# Accessibility

Every interaction must support:

-   Screen readers
-   Keyboard navigation
-   Visible focus
-   Adequate contrast

------------------------------------------------------------------------

# Anti-Patterns

Avoid:

-   Nested scrolling
-   Unexpected page jumps
-   Modal overload
-   Blocking spinners
-   Hidden actions
-   Auto-scrolling without user intent

------------------------------------------------------------------------

# Evolution

New interaction patterns require an approved RFC before adoption.
