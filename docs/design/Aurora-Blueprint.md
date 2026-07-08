# Aurora Blueprint v1.0

> **Project:** Desklabs UI Foundation\
> **Status:** Design Blueprint\
> **Owner:** Project Aurora

------------------------------------------------------------------------

# Vision

Build the best **Customer Operating System** experience.

The product should feel:

-   🍎 Calm like Apple
-   ⚡ Fast like Linear
-   💬 Familiar like WhatsApp

**Conversation is always the hero.**

------------------------------------------------------------------------

# Core Principles

1.  Conversation First
2.  Workspace, not Dashboard
3.  Context on Demand
4.  One Primary Action per screen
5.  Progressive Disclosure
6.  AI assists, never dominates
7.  Reuse patterns before creating new ones

------------------------------------------------------------------------

# Workspace Shell

    Sidebar
    ↓
    Workspace Header
    ↓
    Workspace Content
    ↓
    Context Sheet
    ↓
    Overlay Layer

## Rules

-   No nested cards
-   Minimal borders
-   Flat surfaces
-   One visual focus
-   Shared layout across all modules

------------------------------------------------------------------------

# Navigation

Top-level workspaces only:

-   Today
-   Inbox
-   Customers
-   Operations
-   Knowledge
-   Automation
-   Settings

Booking, Finance, Leads, Payments and Trips become contextual
experiences instead of navigation items.

------------------------------------------------------------------------

# Conversation Workspace

Conversation is the visual hero.

-   Fixed conversation list
-   Fluid conversation area
-   Context Sheet slides over when needed
-   Composer always aligned with the conversation lane

------------------------------------------------------------------------

# Context Sheet

Reusable slide-over pattern for:

-   Customer Passport
-   Booking Details
-   Finance Details
-   Knowledge Preview
-   AI Context

------------------------------------------------------------------------

# AI Experience

AI is **ambient**, not a permanent sidebar.

Patterns:

-   Ghost Text
-   Suggested Reply
-   Rewrite
-   Summarize
-   Next Best Action
-   Keyboard Shortcuts

------------------------------------------------------------------------

# Visual DNA

## Radius

-   Buttons: 14
-   Inputs: 14
-   Cards: 18
-   Sheets: 20
-   Bubbles: 24

## Typography

30 → 24 → 20 → 16 → 14 → 12

## Motion

-   Hover: 120ms
-   Panel: 220ms
-   Sheet: 260ms
-   Spring easing

------------------------------------------------------------------------

# Aurora Sprint

-   PR-001 Workspace Shell
-   PR-002 Navigation
-   PR-003 Workspace Header
-   PR-004 Conversation List
-   PR-005 Conversation Thread
-   PR-006 Composer
-   PR-007 Context Sheet
-   PR-008 Customer Passport
-   PR-009 AI Layer
-   PR-010 Motion System

------------------------------------------------------------------------

# Definition of Done

A redesign is complete only if:

-   Matches Aurora principles
-   Uses reusable components
-   Responsive
-   Accessible
-   Passes Codex technical review
-   Passes Product review
-   Ready to become the default pattern for future modules

------------------------------------------------------------------------

# Versioning

This document is part of the repository and **must be committed**.

Future updates should extend this document instead of creating
disconnected UI specifications.
