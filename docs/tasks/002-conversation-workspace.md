# Task 002 — Conversation Workspace

**Status:** 🟠 Build  
**Priority:** P0

---

# Objective

Wire the Inbox module to the new Aurora Workspace Shell.

This task establishes the new conversation workspace layout without redesigning message bubbles, composer, or business logic.

The goal is to migrate the page architecture first.

---

# References

Read before implementation:

- docs/design/Aurora-Blueprint.md
- docs/tasks/001-workspace-shell.md
- docs/02-constitution.md
- .cursor/rules/*

---

# Scope

Integrate the existing Inbox into the Aurora Workspace Shell.

Use:

- WorkspaceShell
- WorkspaceHeader
- WorkspaceContent
- ContextSheet
- OverlayLayer

---

# Layout

Sidebar
→ Conversation List
→ Conversation Thread
→ Context Sheet (slide-over)

Conversation Thread remains the visual hero.

---

# Requirements

## Workspace Header

Support:
- Title
- Subtitle
- Search slot
- Action slot

## Conversation List

Keep existing functionality.

Allowed:
- Width normalization
- Spacing cleanup
- Remove unnecessary nested containers

## Conversation Thread

Keep existing implementation.

Do NOT redesign:
- bubbles
- timestamps
- grouping
- composer

Only migrate into WorkspaceContent.

## Context Sheet

Replace permanent inspector.

Initial tabs:
- AI Copilot
- Customer Passport
- Resources
- History

Closed by default.

---

# Out of Scope

Do NOT redesign:

- Bubble UI
- Composer
- AI experience
- Customer Passport content
- Business logic
- Database
- API

---

# Acceptance Criteria

- Inbox uses WorkspaceShell
- Conversation becomes primary reading lane
- ContextSheet replaces permanent inspector
- No regressions
- Dark mode supported
- Responsive
- ContextSheet uses Aurora motion

---

# Validation

Run:

- npm run lint
- npm run typecheck
- npm run build

---

# Deliverables

- Inbox migrated to WorkspaceShell
- Legacy right inspector removed from default layout
- ContextSheet integrated
- Existing functionality preserved

---

# Definition of Done

Ready for Task 003 (Conversation List redesign).
