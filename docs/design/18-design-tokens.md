# 18 --- Design Tokens

**Status:** Draft\
**Owner:** Product\
**Version:** 1.0

------------------------------------------------------------------------

# Purpose

Design Tokens define the visual primitives used throughout Desklabs.

They ensure consistency across every workspace, component, and future
platform.

------------------------------------------------------------------------

# Principles

-   One source of truth
-   Semantic over hardcoded values
-   Theme-aware
-   Reusable across web and future mobile apps

------------------------------------------------------------------------

# Color Tokens

## Brand

-   Primary
-   Primary Hover
-   Primary Active

## Surface

-   Background
-   Surface
-   Surface Elevated
-   Surface Muted

## Text

-   Primary
-   Secondary
-   Muted
-   Disabled

## Semantic

-   Success
-   Warning
-   Danger
-   Info

Never reference raw hex values directly in components.

------------------------------------------------------------------------

# Spacing Scale

Base: 8pt system

Allowed values:

4, 8, 16, 24, 32, 48, 64

Avoid arbitrary spacing.

------------------------------------------------------------------------

# Radius

-   xs: 6px
-   sm: 8px
-   md: 12px
-   lg: 16px
-   xl: 20px

Use consistently.

------------------------------------------------------------------------

# Typography Tokens

Display

Heading

Section

Body

Caption

Metadata

Avoid creating page-specific font sizes.

------------------------------------------------------------------------

# Elevation

Levels:

0 --- Flat

1 --- Interactive

2 --- Floating

3 --- Modal

Prefer borders over heavy shadows.

------------------------------------------------------------------------

# Borders

Default: 1px

Dividers: Subtle only.

Every border must have purpose.

------------------------------------------------------------------------

# Motion Tokens

Hover: 120ms

Small transition: 150ms

Panel: 180ms

Page: 200ms

Standard easing across the product.

------------------------------------------------------------------------

# Z-Index

Reserve semantic layers:

-   Base
-   Dropdown
-   Popover
-   Sheet
-   Modal
-   Toast

Avoid arbitrary z-index values.

------------------------------------------------------------------------

# Breakpoints

Primary targets:

-   1280
-   1440
-   1600
-   1920

Design desktop-first.

------------------------------------------------------------------------

# Iconography

Standard library:

Lucide

Use consistent stroke width and sizing.

------------------------------------------------------------------------

# Component Mapping

Buttons, forms, badges, tables, dialogs, inspectors, timelines, and
empty states must consume shared tokens.

Never define local visual constants.

------------------------------------------------------------------------

# Dark Mode

Tokens adapt automatically.

Never create duplicate component styles for dark mode.

------------------------------------------------------------------------

# Accessibility

Token choices must maintain WCAG AA contrast.

Focus indicators remain visible in every theme.

------------------------------------------------------------------------

# Internationalization

Tokens are language-agnostic.

Copy is handled through i18n only.

------------------------------------------------------------------------

# Definition of Done

A visual change is complete only if it:

-   Uses shared tokens
-   Avoids hardcoded values
-   Supports light and dark mode
-   Preserves consistency across all workspaces
