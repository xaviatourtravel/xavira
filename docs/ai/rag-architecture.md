# RAG Architecture

**Status:** Stable\
**Version:** 1.0\
**Owner:** AI Platform\
**Last Updated:** 2026-07-06\
**Applies To:** Inbox, Business Brain, CRM, Automation

------------------------------------------------------------------------

# Purpose

Retrieval-Augmented Generation (RAG) ensures AI answers using verified
business knowledge instead of relying only on model memory.

The goal is to maximize factual accuracy while minimizing
hallucinations.

------------------------------------------------------------------------

# Guiding Principles

-   Retrieve before generating.
-   Prefer Business Brain over model knowledge.
-   Rank trusted sources first.
-   Show uncertainty when evidence is insufficient.
-   Every AI answer should be traceable to its sources.

------------------------------------------------------------------------

# Retrieval Flow

``` text
Customer Message
        │
        ▼
Intent Detection
        │
        ▼
Build Retrieval Query
        │
        ▼
Search Business Brain
        │
        ├──────────────┐
        ▼              ▼
 Products        Knowledge Base
        │              │
        ├──────────────┤
        ▼              ▼
 Documents      Company Identity
        │              │
        └──────┬───────┘
               ▼
 Rank Results
               ▼
 Context Builder
               ▼
 LLM
               ▼
 Response Validation
```

------------------------------------------------------------------------

# Retrieval Sources

Priority order:

1.  Company Identity
2.  Products
3.  Knowledge Articles
4.  Documents
5.  Customer Memory
6.  Conversation Context
7.  General Model Knowledge (last resort)

Higher-priority sources always override lower-priority sources.

------------------------------------------------------------------------

# Ranking Signals

Results are ranked using:

-   Semantic similarity
-   Product relevance
-   Publish status
-   Confidence score
-   Freshness
-   Workspace ownership

Draft or archived content should never be preferred over published
content.

------------------------------------------------------------------------

# Context Assembly

The Context Builder should:

-   Merge duplicate facts.
-   Remove conflicting information.
-   Respect token limits.
-   Preserve source attribution.
-   Keep only relevant context.

------------------------------------------------------------------------

# Hallucination Prevention

If required knowledge cannot be found:

-   Do not invent answers.
-   Acknowledge missing information.
-   Recommend human assistance or Business Brain updates.

------------------------------------------------------------------------

# Source Attribution

Every AI response should internally track:

-   Retrieved sources
-   Confidence
-   Rules applied
-   Missing knowledge

Safe summaries of this metadata may be displayed in AI Copilot.

Never expose chain-of-thought.

------------------------------------------------------------------------

# Missing Knowledge

When retrieval fails:

1.  Detect missing topic.
2.  Surface "Missing Knowledge".
3.  Offer "Create Knowledge".
4.  Improve Business Brain over time.

------------------------------------------------------------------------

# Future

-   Hybrid search
-   Vector + keyword retrieval
-   Personalized ranking
-   Automatic document chunking
-   Cross-workspace retrieval
-   Citation-aware responses

------------------------------------------------------------------------

# Architecture Rules

-   Retrieval happens before generation.
-   Business Brain is always the primary knowledge source.
-   Published content is preferred.
-   Low-confidence retrieval reduces AI confidence.
-   AI must remain transparent about missing context.
