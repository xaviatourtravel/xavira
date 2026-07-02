# Desklabs Component System

Version: 1.0

---

# Philosophy

Every screen in Desklabs is built from reusable components.

Pages are compositions.

Not custom designs.

If a new page requires new components,

the component must first enter this document.

---

# Component Hierarchy

Level 1

Layout Components

Sidebar

Topbar

Workspace Container

Section

Panel

---

Level 2

Work Components

Hero Card

Queue

Queue Item

Customer Card

Conversation Card

Booking Card

Task Card

Payment Card

AI Briefing

Workspace Health

---

Level 3

Primitive Components

Button

Badge

Avatar

Status

Input

Select

Search

Empty State

Metric

Icon

Divider

---

# Hero Card

Purpose

Present the single highest priority work.

Contains

Label

Title

Reason

Context

Primary CTA

Maximum

One Hero Card per workspace.

---

# Queue

Purpose

Show remaining work.

Never use cards.

Always use compact rows.

Maximum visible items

5

Additional items

Accessible through "View All".

---

# Queue Item

Contains

Object Name

Action

Context

Estimated Time

Chevron

Hover

Gray Background

Clickable

Entire Row

---

# AI Briefing

Purpose

Summarize today's work.

Never exceed five bullets.

Contains

Summary

Risks

Recommendation

Optional CTA

Never display charts.

---

# Workspace Health

Purpose

Quick operational status.

Maximum

Four metrics.

Metrics should be operational,

not executive.

Good

Unread

Outstanding

Bookings

Follow Ups

Bad

Revenue

Growth

Yearly KPI

Marketing Charts

---

# Customer Card

Contains

Customer

Status

Journey

Primary Action

Never display all customer information.

---

# Conversation Card

Contains

Customer

Latest Message

Channel

Assigned User

Unread

Priority

---

# Booking Card

Contains

Package

Departure

Payment Status

Outstanding

Primary Action

---

# Payment Card

Contains

Invoice

Amount

Status

Due Date

Action

---

# Buttons

Primary

Blue Filled

Secondary

Outline

Ghost

Transparent

Danger

Red

Maximum one primary button per section.

---

# Status Badges

Success

Green

Warning

Orange

Danger

Red

Information

Blue

Neutral

Gray

Never invent new badge colors.

---

# Search

Always placed in Topbar.

Always globally accessible.

Height

44px

Radius

12px

---

# Empty State

Contains

Illustration (optional)

Explanation

Primary CTA

Never say:

"No Data"

Always explain:

Why

What next

---

# Section

Contains

Label

Title

Optional Action

Body

Sections are separated by whitespace,

not borders.

---

# Lists

Preferred over tables.

Only use tables for operational density.

Everything else should become lists.

---

# Cards

Cards communicate work.

Cards never decorate layouts.

Every card must contain:

Object

Context

Action

If action is missing,

the card should not exist.

---

# Component Rules

Never build page-specific components.

Always compose from existing components.

If a component repeats three times,

it becomes part of this document.

Consistency is a product feature.
