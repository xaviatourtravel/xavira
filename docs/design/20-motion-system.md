# 20 --- Motion System

**Status:** Draft\
**Owner:** Product\
**Version:** 1.0

------------------------------------------------------------------------

# Purpose

Motion in Desklabs exists to explain change, not to entertain.

Every animation should help users understand: - what changed - where it
moved - what to do next

If an animation does not improve understanding, remove it.

------------------------------------------------------------------------

# Motion Principles

## Calm

Animations should feel subtle and confident.

Never flashy.

------------------------------------------------------------------------

## Functional

Motion communicates:

-   navigation
-   state changes
-   hierarchy
-   continuity

------------------------------------------------------------------------

## Fast

The interface should always feel responsive.

Avoid long transitions.

------------------------------------------------------------------------

# Duration Scale

  Interaction        Duration
  ------------------ ----------
  Hover              120ms
  Button Press       120ms
  Small Transition   150ms
  Panel / Sheet      180ms
  Page Transition    200ms
  Modal              200ms
  Toast              180ms

Keep durations consistent.

------------------------------------------------------------------------

# Easing

Default:

Ease-out

Avoid bounce and elastic easing.

Animations should stop naturally.

------------------------------------------------------------------------

# Page Transition

-   Fade + slight translate
-   Never dramatic slide
-   Preserve context

------------------------------------------------------------------------

# Inspector

Opening:

-   Slide from right
-   Fade in simultaneously

Closing:

-   Reverse transition

Duration: 180ms

------------------------------------------------------------------------

# Dialog

-   Fade overlay
-   Scale 98% → 100%
-   Fade content

Avoid oversized zoom animations.

------------------------------------------------------------------------

# Drawer / Sheet

Desktop: Slide from right.

Mobile: Slide from bottom.

------------------------------------------------------------------------

# Tabs

Switch content with:

-   quick fade
-   preserve height when possible

Avoid horizontal page-like slides.

------------------------------------------------------------------------

# Hover

Hover never changes layout.

Allowed:

-   background
-   border
-   subtle elevation

Not allowed:

-   shifting text
-   resizing buttons

------------------------------------------------------------------------

# Buttons

Press:

-   subtle opacity
-   subtle scale (optional)

Loading:

Keep width fixed.

Avoid layout jumps.

------------------------------------------------------------------------

# Skeletons

Fade in.

Replace with content without shifting layout.

------------------------------------------------------------------------

# Toasts

Appear:

Bottom-right desktop.

Bottom mobile.

Fade + slight upward motion.

Auto-dismiss.

------------------------------------------------------------------------

# Lists

Insertion:

Fade + slight translate.

Removal:

Fade out.

Never collapse abruptly.

------------------------------------------------------------------------

# Messages

New incoming message:

Fade in.

Maintain scroll position.

Do not interrupt typing.

------------------------------------------------------------------------

# Realtime Updates

Updates should never steal focus.

If user is typing:

Queue visual updates until safe.

------------------------------------------------------------------------

# Accessibility

Respect reduced motion preferences.

If prefers-reduced-motion is enabled:

-   remove non-essential animation
-   keep functional transitions instant

------------------------------------------------------------------------

# Performance

Use transform and opacity.

Avoid animating:

-   width
-   height
-   top
-   left

Prefer GPU-friendly properties.

------------------------------------------------------------------------

# Definition of Done

A motion implementation is complete when:

-   It communicates change clearly
-   It preserves user context
-   It respects reduced motion
-   It uses shared timing and easing
-   It feels consistent across all workspaces
