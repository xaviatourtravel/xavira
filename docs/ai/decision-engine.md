# Decision Engine

**Status:** Stable\
**Version:** 1.0\
**Owner:** AI Platform\
**Last Updated:** 2026-07-06\
**Applies To:** Inbox, Business Brain, Automation, CRM

------------------------------------------------------------------------

# Purpose

The Decision Engine is responsible for deciding **how AI should
respond**, **whether AI should respond**, and **what information should
be used**.

Large Language Models (LLMs) generate language.

The Decision Engine controls behavior.

------------------------------------------------------------------------

# Principles

-   Deterministic rules always run before the LLM.
-   Business Brain is the primary source of truth.
-   AI should ask for missing information before guessing.
-   Human takeover is preferred over hallucination.
-   Every decision must be explainable.

------------------------------------------------------------------------

# Decision Pipeline

``` text
Incoming Message
        │
        ▼
Channel Validation
        │
        ▼
Conversation Context
        │
        ▼
Intent Detection
        │
        ▼
Customer Memory
        │
        ▼
Business Brain Retrieval
        │
        ▼
Qualification Check
        │
        ▼
Decision Engine
        ├───────────────┐
        │               │
        ▼               ▼
 Human Required?      AI Can Respond?
        │               │
        ▼               ▼
 Human Queue        Generate Draft
        │               │
        └──────┬────────┘
               ▼
 Response Validation
               ▼
 Timeline + CRM Update
```

------------------------------------------------------------------------

# Inputs

The engine evaluates:

-   Customer message
-   Conversation history
-   Customer Memory
-   Business Brain
-   Product catalog
-   Knowledge articles
-   Company Identity
-   AI Rules
-   Workspace settings

------------------------------------------------------------------------

# Intent Categories

Supported intents include:

-   Greeting
-   Product Inquiry
-   Pricing
-   Departure Schedule
-   Visa
-   Payment
-   Booking
-   Complaint
-   Refund
-   Follow-up
-   General Question
-   Human Request
-   Unknown

------------------------------------------------------------------------

# Qualification Logic

Before recommending a package, attempt to collect:

1.  Destination
2.  Departure period
3.  Passenger count
4.  Budget
5.  Special requests

If critical fields are missing, AI should ask one question at a time.

------------------------------------------------------------------------

# Human Escalation Rules

Escalate when:

-   Customer explicitly requests a human.
-   Complaint cannot be resolved.
-   Confidence is below threshold.
-   Required knowledge is unavailable.
-   Company rules require manual approval.

------------------------------------------------------------------------

# Knowledge Priority

1.  Company Identity
2.  Products
3.  Knowledge
4.  Documents
5.  Customer Memory
6.  Conversation Context

Lower-priority sources must never override higher-priority ones.

------------------------------------------------------------------------

# Confidence Thresholds

  Confidence   Action
  ------------ ------------------------------------------------
  90--100      Reply automatically (if automation is enabled)
  70--89       Generate AI draft for review
  Below 70     Ask clarification or escalate

------------------------------------------------------------------------

# Output

The engine returns:

-   Action (Reply / Ask / Escalate)
-   Confidence
-   Missing Information
-   Sources Used
-   Suggested Next Step

------------------------------------------------------------------------

# Future

Planned capabilities:

-   Multi-agent routing
-   Workflow orchestration
-   Predictive qualification
-   Autonomous follow-up
-   Voice interaction
