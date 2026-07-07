# Inbox v2 Design Specification

Status: Draft
Owner: Product
Version: 2.0

---

# Vision

Inbox bukan sekadar tempat membalas chat.

Inbox adalah workspace dimana seorang sales bisa:

- memahami customer dalam hitungan detik
- mengetahui langkah berikutnya
- membalas lebih cepat
- tanpa merasa sedang memakai CRM.

Target feeling:

> Calm.
> Fast.
> Premium.
> Invisible.

User seharusnya fokus ke customer, bukan ke software.

---

# Design Principles

1. Conversation First

Chat adalah pusat layar.

Semua elemen lain membantu percakapan.

Bukan mengalihkan perhatian.

---

2. Progressive Disclosure

Jangan tampilkan semua informasi sekaligus.

Tampilkan:

yang paling penting

↓

baru detail

↓

baru metadata.

---

3. One Question Per Panel

Setiap panel hanya menjawab SATU pertanyaan.

AI Copilot

↓

Apa yang harus saya balas?

Customer 360

↓

Siapa customer ini?

Resources

↓

Apa yang bisa saya kirim?

History

↓

Apa yang sudah terjadi?

---

4. Calm Workspace

Tidak ada dashboard.

Tidak ada card bertumpuk.

Tidak ada badge dimana-mana.

Whitespace lebih penting daripada border.

---

# Layout

4 column.

Sidebar

Conversation

Chat

Inspector

Inspector tidak boleh lebih dominan daripada chat.

Target width

Sidebar

240

Conversation

320

Chat

Flexible

Inspector

400

---

# Column 1

Sidebar

Tujuan:

Navigasi.

Bukan dashboard.

Rules

gunakan icon

teks kecil

badge seperlunya

jangan ada dekorasi.

---

# Column 2

Conversation List

Harus bisa discan dalam 2 detik.

Hierarchy

Avatar

↓

Nama

↓

Preview

↓

Metadata

Row

72–80px.

Selected state

Soft tint.

Unread

Compact badge.

Preview

2 lines max.

---

Header

Search

Primary filters

More

Tidak ada title besar.

Search adalah entry point.

---

# Column 3

Chat

Ini hero.

Semua fokus kesini.

Header

Avatar

Nama

Status

AI Mode

Action

Satu baris.

---

Messages

Customer

Light bubble.

Agent

Dark bubble.

System

Centered.

Bubble width

68%.

Spacing

Generous.

Timestamp

Muted.

---

Composer

Rounded.

Minimal.

Tidak ada toolbar yang ramai.

Primary CTA

Send.

---

# Column 4

Inspector

Inspector bukan dashboard.

Inspector bukan CRM.

Inspector adalah context.

Rules

Flat.

Divider.

Property list.

Minimal card.

No nested card.

---

Tabs

AI Copilot

Customer 360

Resources

History

---

AI Copilot

Order

Hero Recommendation

↓

Suggested Reply

↓

Next Action

↓

Knowledge Gap

---

Customer 360

Order

Identity

↓

Travel Intent

↓

Missing Info

↓

CRM

↓

Quick Action

---

Resources

Order

Recommended

↓

Products

↓

Documents

↓

Media

---

History

Timeline.

Today

Yesterday

Older.

No cards.

---

# Typography

One H1.

One H2.

Body.

Caption.

No more.

---

# Spacing

8

16

24

32

Nothing else.

---

# Border Philosophy

Every border must earn its place.

If whitespace solves it,

remove border.

---

# Empty States

Never blank.

Always

Icon

Title

Description

Action.

---

# Loading

Prefer skeleton.

Avoid spinner.

---

# Motion

150–200ms.

Ease.

No flashy animation.

---

# Color

Primary

Only for action.

Muted

For metadata.

Danger

Rare.

Success

Only when important.

---

# Badge Rules

Maximum 2 badges per row.

No badge wall.

---

# Property Lists

Preferred

Destination      Japan

Budget           Unknown

Departure        September

Avoid

Destination

Japan

---

# Information Hierarchy

User should know within 3 seconds

Who is customer

↓

What did customer ask

↓

What should I do

Everything else is secondary.

---

# Success Metric

A new sales agent can:

find context,

understand customer,

reply,

within

30 seconds.

Without training.