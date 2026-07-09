# Aurora Inbox V2

Version: 2.0\
Status: Draft (Source of Truth)

# Vision

Aurora Inbox bukan aplikasi chat.

Aurora Inbox adalah **Conversation Workspace**.

Tujuannya bukan membantu user mengirim pesan.

Tujuannya membantu user menyelesaikan pekerjaan yang berasal dari
percakapan.

------------------------------------------------------------------------

# Design Principles

-   Conversation First
-   Context Never Lost
-   AI Assists, Never Interrupts
-   Calm Workspace
-   Work Before Data
-   Whitespace Before Decoration
-   Hierarchy Before Color

------------------------------------------------------------------------

# Layout

    ┌──────────────────────────────────────────────────────────────────────────────┐
    │ Global Navigation                                                    User    │
    ├──────────────┬──────────────────────────────────────────────┬───────────────┤
    │ Queue        │ Conversation Workspace                       │ Context Rail  │
    │ 340 px       │ Flexible                                     │ 360 px        │
    └──────────────┴──────────────────────────────────────────────┴───────────────┘

-   Queue selalu terlihat.
-   Conversation selalu menjadi visual hero.
-   Context Rail dapat collapse tanpa menggeser Conversation.

------------------------------------------------------------------------

# Dimensions

  Element          Width
  -------------- -------
  Sidebar          280px
  Queue            340px
  Reading Lane     760px
  Context Rail     360px
  Gap               24px

------------------------------------------------------------------------

# Inbox Header

Height: **64px**

Berisi: - Title - Live KPI - Global Search - Create - Actions - Profile

Tidak boleh berisi: - Workspace Button - AI Toggle - Conversation
Actions

------------------------------------------------------------------------

# Queue

Queue dibuat untuk **Scanning**, bukan membaca.

Setiap item harus menjawab:

-   Siapa?
-   Prioritas?
-   Topik?
-   Pesan terakhir?
-   Waktu?
-   Owner?

Selected state: - Left accent - Soft background - Tanpa border tebal

Hover: - 120ms - Muted background

------------------------------------------------------------------------

# Conversation Header

Berisi: - Avatar - Customer Name - Channel - Journey / Package -
Assigned Owner - Status - Customer Workspace shortcut

Tidak boleh ada: - Global Search - Global Create

------------------------------------------------------------------------

# Reading Lane

-   Max width: **760px**
-   Bubble max width: **88%**
-   Centered
-   Whitespace harus punya fungsi

------------------------------------------------------------------------

# Composer

Floating.

Komponen: - Attachment - Input - Emoji - Templates - Knowledge - Send

Reserved: - AI Suggestion - Ghost Reply

------------------------------------------------------------------------

# Context Rail

Collapsed by default.

Isi: - Customer Passport - Booking - Payments - Timeline - Notes -
Documents - AI

Tidak boleh mendorong Conversation keluar dari center.

------------------------------------------------------------------------

# Motion

  Interaction     Duration
  ------------- ----------
  Hover              120ms
  Popover            180ms
  Sheet              220ms
  Dialog             260ms

------------------------------------------------------------------------

# Typography

  Type        Size
  --------- ------
  Display       28
  Title         20
  Body          14
  Meta          12
  Caption       10

------------------------------------------------------------------------

# Radius

  Component     Radius
  ----------- --------
  Chip            Full
  Button            12
  Card              20
  Composer          24
  Sheet             28

------------------------------------------------------------------------

# Anti Patterns

-   Permanent inspector
-   Double search bars
-   Toolbar berpindah posisi
-   Empty whitespace tanpa fungsi
-   Nested cards
-   Dashboard-style chat
-   AI popup
-   Multiple primary buttons

------------------------------------------------------------------------

# Definition of Done

-   Visual match ≥95%
-   Lint pass
-   Typecheck pass
-   Build pass
-   Dark mode pass
-   Responsive pass
-   Keyboard pass
-   Accessibility pass
-   Motion pass
-   UX approved
-   Product approved
