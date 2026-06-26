# RFC-0002 — Task Engine as Operational Center

**Status:** Proposed

## Problem

Desklabs already manages leads, bookings, payments, participants, follow-ups, and conversations, but users still need to think manually about what to do next. Work is spread across modules.

## Solution

Introduce Task Engine as the central operational layer that converts business events into actionable work.

**Core principle:** Customer gives context. Task Engine gives direction.

This is not a generic task manager. It is an operational task engine for customer operations.

## Task types

- `reply_conversation`
- `follow_up_customer`
- `confirm_payment`
- `request_passport`
- `complete_participant_data`
- `create_booking`
- `send_payment_reminder`
- `review_ai_suggestion`
- `resolve_inbox_unread`
- `custom`

## Task statuses

- `open`
- `in_progress`
- `completed`
- `skipped`
- `overdue`

## Priority

- `low`
- `normal`
- `high`
- `urgent`

## Future automation

- New unread message → Reply Customer task
- Follow-up due date → Follow Up task
- DP unpaid → Confirm Payment task
- Missing passport → Request Passport task
- AI detects hot intent → Review AI Suggestion task

## Today Workspace

Route: `/today`

Sales users start their day here. This is an action workspace, not a dashboard.

When the `tasks` table has saved records, those are shown. When empty, the engine derives virtual tasks from existing operational data (inbox, follow-ups, bookings, participants) without persisting duplicates on each page load.
