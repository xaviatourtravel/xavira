# Desklabs Design Language

Version: 3.0

---

# Philosophy

Desklabs is not an ERP.

Desklabs is not a CRM.

Desklabs is a Work Operating System.

Every screen reduces cognitive load.

Every interaction shortens work.

Users should feel they are working,
not managing software.

---

# Experience Principles

## Calm

Whitespace is a feature.

Silence is part of the interface.

Never fill space simply because it exists.

---

## Work First

People open Desklabs to finish work.

Information exists only to support work.

Never the opposite.

---

## Clear Hierarchy

Every screen has:

1 Primary Action

2 Secondary Actions

Unlimited supporting information.

Never multiple competing focal points.

---

## Progressive Disclosure

Show only what users need now.

Everything else appears on demand.

Never overwhelm first.

---

## Human Assisted

AI recommends.

Humans decide.

AI never becomes the interface.

---

## Consistency

If two screens solve the same problem,

they must use the same components.

Never redesign patterns.

---

# Emotional Goal

Users should feel:

✓ Calm

✓ Fast

✓ Confident

✓ Organized

✓ In Control

Never:

✗ Busy

✗ Confused

✗ Lost

✗ Overwhelmed

---

# Design Principles

## 01 Calm over Busy

Whitespace is functional.

Every empty space improves focus.

---

## 02 Information before Decoration

Hierarchy first.

Typography second.

Color third.

Decoration last.

---

## 03 One Primary Action

Every section has one primary CTA.

If there are more than three primary buttons,

the layout has failed.

---

## 04 Cards are Containers

Cards never exist for decoration.

Each card represents a meaningful object.

Conversation

Customer

Booking

Payment

Task

Workspace

---

## 05 Conversation is the Entry Point

Conversation starts work.

Everything else provides context.

---

## 06 Work Before Data

Users come to finish work.

Not browse records.

Always prioritize actions.

---

## 07 Progressive Context

Context follows the user.

The user never chases context.

---

## 08 Invisible AI

AI appears only when useful.

Never ask users to "open AI."

---

# Layout

Sidebar

240px

Topbar

72px

Maximum Content Width

1280px

Page Padding X

40px

Page Padding Top

40px

Section Gap

40px

Card Gap

24px

Card Padding

24px

Never stretch content full-width.

Readable layouts are more important than filling space.

---

# Grid

Desktop

12 Columns

Tablet

8 Columns

Mobile

4 Columns

Main Workspace

70%

Supporting Panel

30%

---

# Spacing Scale

4

8

12

16

24

32

40

48

64

Never invent spacing values.

Only use this scale.

---

# Radius

Card

20

Modal

24

Button

12

Input

12

Badge

999

Avatar

999

---

# Elevation

Only three levels exist.

Level 0

None

Level 1

0 4px 12px rgba(15,23,42,.04)

Level 2

0 8px 24px rgba(15,23,42,.06)

Never create stronger shadows.

Elevation replaces heavy borders.

---

# Colors

Primary

#2563EB

Sidebar

#0F172A

Background

#F8FAFC

Surface

#FFFFFF

Border

#E8EDF5

Heading

#0F172A

Body

#475569

Caption

#64748B

Success

#22C55E

Warning

#F59E0B

Danger

#EF4444

AI

#7C3AED

Primary Blue is reserved for actions.

Green is reserved for success.

Red is reserved for errors.

Never use green as the main CTA.

---

# Typography

Font

Inter

Display

40 / 700

H1

32 / 700

H2

28 / 700

H3

22 / 600

Card Title

20 / 600

Section Label

12 / 700 / Uppercase

Body

16 / 400

Caption

13 / 400

Button

14 / 600

Always create visual hierarchy using typography before color.

---

# Buttons

Primary

Filled Blue

Secondary

Outline

Ghost

Text Only

Danger

Filled Red

Button Height

44px

Button Radius

12px

Only one primary button per section.

---

# Cards

Cards communicate work.

Not decoration.

Every card should contain:

Object

Status

Context

Primary Action

Cards should breathe.

Avoid dense layouts.

---

# Lists

Lists replace tables whenever possible.

Operational queues should always use list layouts.

Hover reveals affordance.

Selection never requires opening another page.

---

# Forms

Input Height

44px

Radius

12px

Labels always above inputs.

Never use placeholders as labels.

Group related fields.

---

# Tables

Tables exist only for dense operational data.

Otherwise,

prefer lists.

---

# Empty States

Every empty state answers:

Why is this empty?

What should I do next?

Provide one clear CTA.

---

# Motion

Transition

200ms

Ease

ease-out

Hover

Lift 2px

Never animate layout shifts.

Motion should reinforce hierarchy,

never distract.

---

# Icons

Lucide Icons only.

18px

Stroke

1.75

Icons support recognition.

Never decoration.

---

# AI

AI appears as:

Summary

Suggestion

Reminder

Draft

Automation

Recommendation

Never expose AI as a destination.

AI should quietly improve workflows.

---

# Workspace Rules

Every workspace immediately presents work.

Never module launchers.

Never landing pages.

Never dashboards.

Users should immediately know:

What should I do first?

What comes next?

What is blocked?

---

# Component Philosophy

Every new component must answer:

Does it shorten work?

Does it reduce clicks?

Does it reduce thinking?

If not,

it should not exist.
