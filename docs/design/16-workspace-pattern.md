# 16 --- Workspace Pattern

**Status:** Draft\
**Owner:** Product\
**Version:** 1.0

------------------------------------------------------------------------

# Purpose

Every major module in Desklabs should follow the same workspace anatomy.

Users should never feel like they are learning a new application when
moving between Inbox, CRM, Booking, Finance, Business Brain, or
Operations.

------------------------------------------------------------------------

# Universal Workspace Structure

All workspaces should follow this layout:

1.  Left Navigation
2.  Context List
3.  Primary Workspace
4.  Right Inspector

This structure should remain consistent across modules.

------------------------------------------------------------------------

# Responsibilities

## Left Navigation

Purpose: Navigate between modules.

Rules: - Icon-first - Compact - Minimal badges - Never contains
page-specific actions

------------------------------------------------------------------------

## Context List

Purpose: Select the current object.

Examples:

Inbox - Conversations

CRM - Customers

Booking - Bookings

Finance - Invoices

Business Brain - Products / Knowledge

Rules: - Search at the top - Primary filters - Secondary filters in
overflow - Comfortable row spacing - Strong selected state

------------------------------------------------------------------------

## Primary Workspace

Purpose: Complete the user's task.

This area should always receive the greatest visual emphasis.

Never let side panels compete with it.

------------------------------------------------------------------------

## Right Inspector

Purpose: Provide context.

Uses the shared Inspector Pattern.

Never becomes a second dashboard.

------------------------------------------------------------------------

# Header Pattern

Every workspace header contains:

-   Title
-   Context metadata
-   Primary action
-   Secondary actions

Avoid oversized toolbars.

------------------------------------------------------------------------

# Primary Action Rule

Only one primary button per workspace.

Examples:

Inbox → Send

CRM → New Customer

Booking → Create Booking

Finance → Create Invoice

Business Brain → New Product

------------------------------------------------------------------------

# Empty States

Every workspace supports:

-   First-use
-   No results
-   Filtered empty
-   Error
-   Offline (if applicable)

Always include: - Icon - Title - Description - Action

------------------------------------------------------------------------

# Loading States

Prefer skeleton layouts matching the final UI.

Avoid layout shifts.

------------------------------------------------------------------------

# Shared Components

Every workspace should reuse:

-   Property rows
-   Inspector
-   Timeline
-   Empty state
-   Skeleton
-   Dialog
-   Toast
-   Badge
-   Buttons
-   Inputs

Avoid creating workspace-specific versions.

------------------------------------------------------------------------

# Responsive Behavior

Desktop: 4-column layout

Tablet: Inspector collapses

Mobile: Inspector becomes drawer Context list becomes overlay

------------------------------------------------------------------------

# Accessibility

-   Keyboard navigation
-   Visible focus
-   ARIA labels
-   Screen reader friendly headings

------------------------------------------------------------------------

# Internationalization

Every visible UI string uses i18n.

Supported: - Bahasa Indonesia - English

No hardcoded copy.

------------------------------------------------------------------------

# Definition of Done

A workspace is complete only if:

-   Follows the universal layout
-   Reuses shared components
-   Uses the Design Language
-   Uses the Inspector Pattern
-   Supports light and dark mode
-   Supports Indonesian and English
-   Passes accessibility and responsive checks
