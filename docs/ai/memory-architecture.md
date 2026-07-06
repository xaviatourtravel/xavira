# Memory Architecture

**Status:** Stable\
**Version:** 1.0\
**Owner:** AI Platform\
**Last Updated:** 2026-07-06\
**Applies To:** Inbox, CRM, Business Brain, Automation

------------------------------------------------------------------------

# Purpose

The Memory Architecture defines what AI remembers, how long it remembers
it, and how that information influences future conversations.

Memory exists to improve continuity, not to store everything.

------------------------------------------------------------------------

# Design Principles

-   Remember only information that improves future conversations.
-   Never store sensitive information unless explicitly required.
-   Prefer structured memory over free-form notes.
-   Memory must always be explainable.
-   Every memory should have a confidence level and source.

------------------------------------------------------------------------

# Memory Layers

## 1. Conversation Context

Temporary context from the current chat session.

Examples:

-   Current topic
-   Current package
-   Current questions

Lifetime: Current conversation only.

------------------------------------------------------------------------

## 2. Session Memory

Facts collected during the active sales journey.

Examples:

-   Destination
-   Departure month
-   Passenger count
-   Budget
-   Preferred airline

Lifetime: Until booking is completed or abandoned.

------------------------------------------------------------------------

## 3. Customer Memory

Long-term preferences.

Examples:

-   Favorite destinations
-   Preferred language
-   Hotel preference
-   Travel style
-   Previous trips

Lifetime: Persistent.

------------------------------------------------------------------------

## 4. Business Memory

Workspace-level knowledge.

Examples:

-   Company Identity
-   Business Brain
-   AI Rules
-   Products
-   Documents

Lifetime: Persistent.

------------------------------------------------------------------------

# Memory Pipeline

``` text
Customer Message
        │
        ▼
Extract Facts
        │
        ▼
Validate
        │
        ▼
Deduplicate
        │
        ▼
Assign Confidence
        │
        ▼
Store Memory
        │
        ▼
Available for Future Retrieval
```

------------------------------------------------------------------------

# Confidence Levels

       Score Meaning
  ---------- --------------------------------------
     90--100 Confirmed by customer
      70--89 Strong inference
    Below 70 Weak inference (review before reuse)

------------------------------------------------------------------------

# Memory Categories

-   Personal Preferences
-   Travel Preferences
-   Booking History
-   Qualification Data
-   Communication Style
-   Business Relationship

------------------------------------------------------------------------

# Retrieval Priority

1.  Conversation Context
2.  Session Memory
3.  Customer Memory
4.  Business Brain
5.  Global Knowledge

------------------------------------------------------------------------

# Expiration

Conversation Context: - Cleared when conversation ends.

Session Memory: - Archived after inactive sales cycle.

Customer Memory: - Never deleted automatically. - Updated when better
information is available.

------------------------------------------------------------------------

# Future

-   Automatic memory summarization
-   Memory conflict resolution
-   Multi-workspace memory
-   Team-shared customer intelligence
