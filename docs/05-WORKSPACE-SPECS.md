# Desklabs Workspace Specifications

Version: 1.0

---

# Purpose

This document defines the purpose, responsibilities, and user experience of every workspace inside Desklabs.

Every workspace exists to help users complete work.

Not to display data.

Each workspace answers exactly one primary question.

---

# Workspace Shell

Every workspace shares the same structure.

- Sidebar
- Header
- Main Workspace
- Optional Context Panel

Users should always feel they are using the same product.

---

# Today Workspace

## Purpose

Orient users before work begins.

## Primary Question

"What should I focus on today?"

## Primary User

Everyone.

## Primary Actions

- Continue unfinished work
- Review priorities
- Open workspace

## Must Show

- Priority cards
- Follow-ups
- Today's schedule
- Assigned work

## Must Never Show

- Large KPI dashboards
- Analytics charts
- Complex reports

---

# Inbox Workspace

## Purpose

Turn conversations into business.

## Primary Question

"Who needs my attention?"

## Primary User

Sales

Customer Service

## Primary Object

Conversation

## Primary Action

Reply

## Secondary Actions

- Assign
- Create Booking
- Create Customer
- Open Profile

## Must Always Show

- Conversation
- Customer
- AI Summary
- Conversation Status

## Context Panel

- Customer Passport
- AI Insights
- Workflow
- Travel History

## Must Never Show

- Revenue dashboards
- Business analytics
- Reports

---

# Customer Workspace

## Purpose

Understand customers completely.

## Primary Question

"Who is this customer?"

## Primary User

Sales

Operations

Finance

## Primary Actions

- View profile
- Review history
- Manage relationship

## Must Show

- Customer profile
- Travel history
- Payment history
- Notes
- Documents

## Must Never Show

- Chat composer
- Operational dashboards

---

# Sales Workspace

## Purpose

Move opportunities forward.

## Primary Question

"What opportunity needs progress?"

## Primary Actions

- Update opportunity
- Send quotation
- Create booking

## Must Show

- Sales pipeline
- Opportunity stage
- Estimated value
- Follow-up date

---

# Operations Workspace

## Purpose

Prepare every departure successfully.

## Primary Question

"What needs preparation?"

## Primary Actions

- Update departure
- Manage passengers
- Prepare documents

## Must Show

- Upcoming departures
- Manifest
- Visa status
- Rooming
- Flights

---

# Finance Workspace

## Purpose

Manage financial activities.

## Primary Question

"What payment needs action?"

## Primary Actions

- Verify payment
- Create invoice
- Track outstanding balance

## Must Show

- Outstanding invoices
- Payment status
- Transaction history

## Must Never Show

- Customer conversations
- Sales pipeline

---

# Workspace Rules

Every workspace has:

- One purpose
- One primary object
- One primary action
- One primary question

If a workspace attempts to solve multiple unrelated problems,

it should be redesigned.

---

# Context Panel Rules

The Context Panel is optional.

Default state:

Collapsed.

It should support work,

never replace it.

Examples:

Inbox

- Passport
- AI Summary
- Workflow

Customer

- Documents
- Notes

Operations

- Departure Details

Finance

- Payment Timeline

---

# Empty States

Every workspace must provide guidance.

Never leave users with an empty screen.

Empty states should explain:

- what this workspace does
- what users should do next

---

# Loading States

Loading should preserve layout.

Avoid layout shifts.

Prefer skeleton loaders.

---

# Error States

Every error should:

- explain the problem
- explain the next action
- never expose technical details

---

# Success States

Every successful action should provide immediate feedback.

Examples:

- Message sent
- Booking created
- Payment verified

Feedback should be subtle.

Never interrupt workflow.

---

# Workspace Quality Checklist

Before release, verify:

- One primary question
- One primary action
- Minimal cognitive load
- Consistent shell
- Polaris compliant
- Constitution compliant
