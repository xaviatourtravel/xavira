# Task 001 --- Aurora Workspace Shell

**Status:** 🔵 Design → 🟠 Build\
**Priority:** P0

------------------------------------------------------------------------

# Objective

Implement the Aurora Workspace Shell as the reusable foundation for
every major workspace inside Desklabs.

This task creates the common layout system shared by:

-   Inbox
-   Today
-   Customers
-   Operations
-   Knowledge
-   Booking
-   Finance
-   Future modules

This task **does not redesign any module**. It only introduces the
reusable shell.

------------------------------------------------------------------------

# References

Read before implementation:

-   docs/design/Aurora-Blueprint.md
-   docs/design/Design-Language.md
-   docs/design/UI-Principles.md
-   docs/design/Component-Guidelines.md
-   docs/02-constitution.md

------------------------------------------------------------------------

# Scope

Create reusable components:

-   WorkspaceShell
-   WorkspaceHeader
-   WorkspaceContent
-   ContextSheet
-   OverlayLayer

------------------------------------------------------------------------

# Component Responsibilities

## WorkspaceShell

-   Full viewport layout
-   Shared spacing
-   Shared responsive behavior
-   Shared transition rules
-   Shared layout constraints

------------------------------------------------------------------------

## WorkspaceHeader

Support:

-   Page title
-   Optional subtitle
-   Search slot
-   Action slot

Must work for every workspace.

------------------------------------------------------------------------

## WorkspaceContent

-   Centered workspace
-   Consistent spacing
-   Reading lane support
-   No nested cards

------------------------------------------------------------------------

## ContextSheet

Replace permanent right inspector.

Requirements:

-   Slide-over
-   Spring animation
-   ESC closes
-   Keyboard accessible
-   Configurable width
-   Reusable across all modules

------------------------------------------------------------------------

## OverlayLayer

Reusable layer for:

-   AI Assistant
-   Command Palette
-   Future overlays

------------------------------------------------------------------------

# Out of Scope

Do NOT redesign:

-   Inbox UI
-   Business Brain
-   Today
-   Booking
-   Finance

No business logic. No database changes. No API changes.

------------------------------------------------------------------------

# Acceptance Criteria

## Layout

-   Shared layout across modules
-   No nested cards
-   Minimal border usage
-   Flat surfaces

## Responsive

-   Desktop
-   Tablet
-   Mobile

## Motion

-   Consistent spring transitions
-   No layout shift

## Accessibility

-   Keyboard navigation
-   Focus management
-   ESC support

## Technical

-   Reusable
-   Type-safe
-   No duplicated logic

------------------------------------------------------------------------

# Validation

Run:

``` bash
npm run lint
npm run typecheck
npm run build
```

All checks must pass.

------------------------------------------------------------------------

# Deliverables

    components/workspace/
    ├── WorkspaceShell.tsx
    ├── WorkspaceHeader.tsx
    ├── WorkspaceContent.tsx
    ├── ContextSheet.tsx
    └── OverlayLayer.tsx

------------------------------------------------------------------------

# Definition of Done

-   Aurora Blueprint respected
-   Existing pages continue to work
-   Components reusable
-   Dark mode supported
-   Responsive
-   Codex technical review passed
-   Product review approved
