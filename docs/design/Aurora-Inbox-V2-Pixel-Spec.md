# Aurora Inbox V2 --- Pixel Specification

Version: 1.0\
Status: Canonical Layout Spec

> This document is the **single source of truth** for implementing the
> Inbox. Engineering must implement this specification exactly. Do not
> reinterpret layout decisions.

------------------------------------------------------------------------

# Canvas

-   Minimum width: 1440px
-   Base grid: 8px
-   Content padding: 24px

```{=html}
<!-- -->
```
    ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
    │ Global Top Bar (64)                                                                          │
    ├──────────────┬──────────────────────────────┬─────────────────────────────────┬──────────────┤
    │ Sidebar      │ Conversation Queue           │ Conversation Workspace          │ Context Rail │
    │ 280          │ 340                          │ Flexible                        │ 360          │
    └──────────────┴──────────────────────────────┴─────────────────────────────────┴──────────────┘

------------------------------------------------------------------------

# Sidebar

Width: 280px

Sections: - Today - Communication - Customers - Operations - Finance -
Intelligence

Rules: - Flat background - No floating cards - Active item = subtle
tint + left accent - Icons 18px

------------------------------------------------------------------------

# Conversation Queue

Width: 340px

Header: - Search - Filter chips

Rows: - Height: 68px - Avatar: 36px - Name: 14 / semibold - Preview:
12 - Time: 11 - Left accent when selected - Hover: muted surface (120ms)

No borders between rows.

------------------------------------------------------------------------

# Conversation Workspace

Flexible width.

Conversation Header: Height: 60px

Contains: - Avatar - Customer Name - Channel - Assigned Owner - Journey
/ Package - Customer Workspace button (RIGHT SIDE OF HEADER)

Never place Customer Workspace button in the Inbox header.

------------------------------------------------------------------------

# Reading Lane

Centered.

Max width: 760px

Bubble: - Max width: 88% - Radius: 24px - Vertical gap inside group:
4px - Gap between groups: 12px

------------------------------------------------------------------------

# Composer

Floating.

Aligned to Reading Lane.

Structure:

\[ + \] \[ Textarea................................ \] \[ 😊 \] \[
Templates \] \[ Send \]

Height: 64px

Radius: 24px

Never dock flush against the viewport edge. Bottom spacing: 16px.

------------------------------------------------------------------------

# Context Rail

Width: 360px

Collapsed by default.

Tabs: - Customer - Booking - Timeline - Payments - Documents - AI

Collapsing must NOT re-center the conversation.

------------------------------------------------------------------------

# Header Rules

Global Header: - Never changes when opening a conversation. - Search
position never moves. - Global actions never disappear.

Conversation Header: - Holds conversation-specific actions only.

------------------------------------------------------------------------

# Empty State

Must include: - Continue where you left off - Assigned conversations -
Needs reply - Recent conversations

Never use only an icon + sentence.

------------------------------------------------------------------------

# Motion

Hover: 120ms Popover: 180ms Sheet: 220ms Dialog: 260ms

Use consistent easing across the product.

------------------------------------------------------------------------

# Acceptance Criteria

-   Screenshot overlay matches design within 95%.
-   No layout interpretation by engineering.
-   Toolbar remains stable.
-   Reading lane remains visually dominant.
-   Context rail never creates dead whitespace.
-   Customer Workspace action belongs to the conversation header.
