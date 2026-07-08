
# Desklabs UI/UX Principles

Version: 1.0
Owner: Product & Design

---

# Purpose

This document defines how every interaction inside Desklabs should behave.

Design Language answers:

> "How Desklabs should look."

UI/UX Principles answer:

> "How Desklabs should work."

Every new feature should be validated against these principles before development.

---

# 1. Calm Workspace

The interface should reduce stress, not create it.

Rules:
- Show only what is needed.
- Remove visual noise before adding new UI.
- Prefer whitespace over borders.
- One clear focus per screen.

Success test:
A new user understands where to look within 3 seconds.

---

# 2. Progressive Disclosure

Complexity should appear only when needed.

Examples:
- Long lists collapse after 5 items.
- Advanced settings are hidden until requested.
- Secondary actions live in menus or drawers.

Never expose every option at once.

---

# 3. One Primary Action

Each screen should have one dominant action.

Good:
- Save
- Send
- Publish
- Book Demo

Avoid multiple competing primary buttons.

---

# 4. Context First

Users should always understand:
- Where am I?
- Who is this customer?
- What is happening?
- What should I do next?

Context always comes before actions.

---

# 5. Readability First

Readable beats visually clever.

Rules:
- Comfortable line length.
- Consistent spacing.
- Compact but not cramped.
- Avoid oversized paragraphs.

Chat bubbles, tables, and forms should optimize for reading speed.

---

# 6. AI Assists, Humans Decide

AI exists to reduce manual work—not replace human judgment.

AI should:
- summarize
- recommend
- draft
- retrieve knowledge
- identify missing information

AI should not hide reasoning or block manual control.

---

# 7. Familiar Interactions

If users already know the pattern from modern software, reuse it.

Inspired by:
- WhatsApp Desktop
- Linear
- Intercom
- Notion
- Slack

Do not reinvent common interactions without a clear benefit.

---

# 8. Information Hierarchy

Every page should naturally guide the eye.

Priority:
1. Primary content
2. Current context
3. Recommended action
4. Secondary metadata

Avoid equally weighted sections.

---

# 9. Keyboard Friendly

Frequently used workflows should support keyboard interaction.

Future shortcuts:
- Ctrl + K
- /
- Enter
- Esc
- Arrow navigation

Mouse should not be required for repetitive work.

---

# 10. Consistency Over Creativity

New components should follow existing patterns.

Avoid creating unique layouts for individual modules.

Shared patterns:
- Inspector
- Empty state
- Loading
- Forms
- Lists
- Expandable sections

---

# 11. Feedback Matters

Every user action should receive feedback.

Examples:
- Loading
- Success
- Error
- Empty state
- Validation

Users should never wonder whether something happened.

---

# 12. Compact by Default

Business users spend hours inside Desklabs.

Rules:
- Compact forms
- Compact cards
- Compact tables
- Two-column editors where appropriate
- Expand long lists

Scrolling should be minimized.

---

# 13. Inbox Principles

Inbox is the product's heart.

Rules:
- Conversation is the hero.
- Customer context is always available.
- AI Copilot is always present.
- Auto Reply settings never disable Copilot.
- Manual takeover is always possible.

---

# 14. Business Brain Principles

Business Brain teaches AI.

Rules:
- Easy to import.
- Easy to edit.
- Easy to verify.
- Long content should collapse by default.
- Parser should accept flexible formats whenever safe.

---

# 15. Error Prevention

Prefer preventing mistakes over showing errors.

Examples:
- Smart parsing
- Auto-formatting
- Duplicate detection
- Validation before publish

---

# 16. Performance Is UX

Fast software feels simpler.

Targets:
- Instant navigation where possible.
- Skeletons instead of blocking loaders.
- Lazy load heavy content.
- Avoid unnecessary rerenders.

---

# 17. Accessibility

Design for everyone.

- Keyboard support
- Clear contrast
- Visible focus states
- Semantic labels
- Screen reader friendly where possible

---

# Definition of Done

A feature is UX-complete when:

- It follows Design Language.
- It follows these UI/UX Principles.
- It has loading, empty, and error states.
- It works in light and dark mode.
- It minimizes scrolling.
- It has one clear primary action.
- It feels consistent with the rest of Desklabs.

---

# North Star

Every interaction should make users feel:

> "Desklabs helps me finish work faster without making me think harder."
