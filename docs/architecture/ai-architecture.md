# AI Architecture

**Status:** Stable\
**Version:** 1.0\
**Owner:** Product + AI\
**Applies To:** Inbox, Business Brain, CRM, Automation

------------------------------------------------------------------------

# Purpose

This document defines how AI operates inside Desklabs.

AI is **not** a standalone feature.

AI is a platform capability that assists users across every workspace.

------------------------------------------------------------------------

# Core Principle

AI should:

-   Assist, not replace.
-   Explain, not hide.
-   Reduce decisions.
-   Respect Business Brain.
-   Never fabricate information.

------------------------------------------------------------------------

# AI Stack

``` text
WhatsApp / Email / Social

        │
        ▼

Communication Gateway

        │
        ▼

Conversation Engine

        │
        ├──────────────┐
        ▼              ▼

Memory Engine     Business Brain

        │              │
        └──────┬───────┘
               ▼

Knowledge Retrieval (RAG)

               ▼

Decision Engine

               ▼

LLM Provider

               ▼

Response Validation

               ▼

Realtime Inbox
```

------------------------------------------------------------------------

# Request Lifecycle

1.  Customer sends a message.
2.  Conversation is stored.
3.  Intent is detected.
4.  Customer memory is loaded.
5.  Relevant Business Brain knowledge is retrieved.
6.  Decision Engine decides whether AI can answer.
7.  LLM generates a draft when needed.
8.  Output is validated against Business Brain rules.
9.  Suggested reply is delivered to Inbox.
10. Conversation, memory, and timeline are updated.

------------------------------------------------------------------------

# Decision Engine Responsibilities

The Decision Engine decides:

-   Should AI answer?
-   Should a human take over?
-   Is more qualification required?
-   Is Business Brain missing information?
-   Which knowledge sources should be used?

The LLM never makes these decisions alone.

------------------------------------------------------------------------

# Business Brain Integration

Every AI response should prioritize:

1.  Company Identity
2.  Products
3.  Knowledge
4.  Documents
5.  Rules
6.  Behaviors

If information is missing, AI should acknowledge the gap instead of
inventing an answer.

------------------------------------------------------------------------

# Memory Layers

## Permanent Memory

Long-term customer preferences.

Examples:

-   Preferred destination
-   Preferred language
-   Travel style

## Session Memory

Current conversation context.

Examples:

-   Current destination
-   Travel date
-   Budget

## Conversation Summary

Generated after meaningful interactions to reduce prompt size.

------------------------------------------------------------------------

# Confidence Levels

-   High (90--100): Reliable recommendation.
-   Medium (70--89): Minor gaps exist.
-   Low (\<70): Missing context should be surfaced.

------------------------------------------------------------------------

# Future Extensions

-   Voice AI
-   Call Summary
-   Multi-agent orchestration
-   Predictive follow-up
-   Autonomous workflows

------------------------------------------------------------------------

# Architecture Rules

-   Business Brain is the primary knowledge source.
-   Deterministic logic is preferred before LLM reasoning.
-   AI explanations must never expose chain-of-thought.
-   Every AI action should be traceable.
-   Human users always retain final control.
