# AI_CONTEXT.md

> Bootstrap context for every AI implementation inside **Desklabs**.

------------------------------------------------------------------------

## Purpose

This file is the single entry point for AI assistants (Cursor, Claude
Code, Codex, ChatGPT, etc.).

Before making **any** implementation, the assistant **must** read and
follow the core product documentation.

Do **not** start implementing features before loading this context.

------------------------------------------------------------------------

# Source of Truth (Priority Order)

When multiple documents overlap, follow this order of authority:

1.  Product Thesis
2.  Constitution
3.  Product Laws
4.  Workspace Specifications
5.  Design Language
6.  Component System

If two documents conflict, the higher document always wins.

------------------------------------------------------------------------

# Required Reading

``` text
docs/
    01-product-thesis.md
    02-constitution.md
    06-product-laws.md
    07-WORKSPACE-SPECS.md
    05-design-language.md
    11-component-system.md
```

------------------------------------------------------------------------

# Product Identity

Desklabs is **not** a CRM.

Desklabs is **not** an ERP.

Desklabs is **not** a chatbot.

Desklabs is an **Operating System for Travel Agencies**.

Every implementation must strengthen that identity.

------------------------------------------------------------------------

# Core Principles

Every implementation must:

-   Reduce decisions.
-   Reduce cognitive load.
-   Preserve user context.
-   Keep AI invisible.
-   Keep work at the center.
-   Follow Calm Workspace principles.

Never introduce features that increase complexity without reducing user
effort.

------------------------------------------------------------------------

# Decision Checklist

Before writing code, answer:

-   Does this shorten the workflow?
-   Does this reduce cognitive load?
-   Does this preserve context?
-   Does this follow the Constitution?
-   Does this improve the overall architecture?

If any answer is **No**, redesign before implementation.

------------------------------------------------------------------------

# Implementation Rules

Always:

-   Reuse existing components.
-   Follow existing workspace patterns.
-   Keep typography and spacing consistent.
-   Respect i18n (Bahasa Indonesia / English).
-   Include loading, empty, error, and success states.
-   Keep dark mode fully supported.
-   Prefer deterministic logic over unnecessary AI calls.

Never:

-   Introduce new UI patterns without updating documentation.
-   Create duplicate components.
-   Add AI simply because it is possible.
-   Break existing workspace consistency.
-   Violate Product Laws.

------------------------------------------------------------------------

# If a Conflict Appears

If implementation conflicts with any governing document:

Do **not** implement immediately.

Instead:

1.  Explain the conflict.
2.  Propose an RFC.
3.  Wait for approval.

The architecture is more important than shipping quickly.

------------------------------------------------------------------------

# Final Rule

Every pull request should leave Desklabs **more consistent than
before**.

Never optimize only for the current feature.

Always optimize for the next 100 features.
