
# Desklabs Design Review Checklist

Version: 1.0
Owner: Product & Design

---

# Purpose

This checklist must be completed before any feature, page, or redesign is considered ready for QA or merged into the main branch.

It applies to:
- Product UI
- Marketing website
- AI interfaces
- Internal tools
- New modules
- Existing redesigns

---

# 1. Product Consistency

- [ ] Uses existing layout patterns.
- [ ] Matches Design Language System.
- [ ] Matches UI/UX Principles.
- [ ] Uses existing reusable components.
- [ ] Does not introduce unnecessary visual patterns.

---

# 2. Layout

- [ ] Clear visual hierarchy.
- [ ] One primary action.
- [ ] Compact spacing.
- [ ] No unnecessary full-width sections.
- [ ] No oversized empty cards.
- [ ] Long forms use two-column layout where appropriate.
- [ ] Inspector follows standard pattern.

---

# 3. Typography

- [ ] Uses approved heading scale.
- [ ] Body text is readable.
- [ ] Metadata is visually secondary.
- [ ] No excessive bold text.
- [ ] Labels use sentence case.

---

# 4. Components

- [ ] Correct button hierarchy.
- [ ] Proper use of cards.
- [ ] Proper use of tables vs lists.
- [ ] ExpandableList used for long collections.
- [ ] Dialogs, drawers, and popovers follow guidelines.

---

# 5. Lists & Data

- [ ] Lists longer than five items collapse by default.
- [ ] Row hierarchy is clear.
- [ ] Status is easy to scan.
- [ ] No duplicate information.
- [ ] Empty collections have helpful empty states.

---

# 6. Forms

- [ ] Logical grouping.
- [ ] Labels above fields.
- [ ] Validation near inputs.
- [ ] Required fields are clear.
- [ ] Smart defaults where possible.

---

# 7. AI Experience

- [ ] AI Copilot remains available.
- [ ] AI Auto Reply semantics are correct.
- [ ] AI recommendations explain why.
- [ ] Missing knowledge is surfaced.
- [ ] Human override is always possible.

---

# 8. Inbox Review

- [ ] Conversation is the visual focus.
- [ ] Bubble width is readable.
- [ ] Date separators appear once per day.
- [ ] Composer aligns with conversation lane.
- [ ] Inspector does not compete with chat.

---

# 9. Business Brain Review

- [ ] Compact editor layout.
- [ ] Parser handles supported formats.
- [ ] FAQ, documents, and AI instructions are easy to access.
- [ ] Long sections are collapsible.
- [ ] Import preview is understandable.

---

# 10. States

Every feature includes:

- [ ] Loading
- [ ] Empty
- [ ] Success
- [ ] Error
- [ ] Permission (if applicable)

---

# 11. Accessibility

- [ ] Keyboard navigation.
- [ ] Visible focus states.
- [ ] Sufficient contrast.
- [ ] Accessible labels.
- [ ] Screen sizes verified.

---

# 12. Responsive

Checked on:

- [ ] Desktop
- [ ] Tablet
- [ ] Mobile

---

# 13. Performance

- [ ] No unnecessary re-renders.
- [ ] Skeletons used instead of blocking loaders.
- [ ] Lazy loading where appropriate.
- [ ] Smooth interactions.

---

# 14. Copy

- [ ] Matches Messaging Framework.
- [ ] Simple, human language.
- [ ] No enterprise jargon.
- [ ] CTA is clear.

---

# 15. Visual QA

- [ ] Light mode.
- [ ] Dark mode.
- [ ] Icons aligned.
- [ ] Borders consistent.
- [ ] Spacing consistent.
- [ ] Animations feel natural.

---

# Release Gate

A feature is considered ready only when:

- All applicable checklist items pass.
- Typecheck passes.
- Build passes.
- Product Owner review complete.
- Design review complete.
- QA review complete.

---

# North Star

Before merging, ask one question:

> Does this make Desklabs feel more calm, more consistent, and easier to use?

If the answer is no, iterate before shipping.
