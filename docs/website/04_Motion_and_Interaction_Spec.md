# Desklabs Motion and Interaction Specification

## 1. Motion philosophy

Motion exists to explain relationships and state changes. It must never compete with the product story.

**Keywords:** calm, precise, spatial, responsive, restrained.

**Avoid:** bounce, elastic overshoot, random rotation, constant floating, dramatic zoom, auto-playing movement with no narrative purpose.

![Motion storyboard](assets/motion_storyboard.png)

## 2. Global timing tokens

| Token | Duration | Use |
|---|---:|---|
| `instant` | 80ms | pressed state and small feedback |
| `fast` | 140ms | hover, focus, icon transitions |
| `standard` | 240ms | component reveal and state transition |
| `section` | 500ms | scroll reveal for major content |
| `hero` | 800ms | initial product mockup entrance |
| `stagger` | 60-90ms | sequential items |

Recommended easing:

- UI: `cubic-bezier(0.2, 0, 0, 1)`
- Section reveal: `cubic-bezier(0.16, 1, 0.3, 1)`
- Exit: `cubic-bezier(0.4, 0, 1, 1)`

## 3. Hero animation sequence

Total loop: 8-10 seconds. Play once on load; allow subtle idle state afterward. Do not continuously replay a distracting sequence.

1. 0.0-0.6s: background glow fades from 0 to 1.
2. 0.15-0.9s: eyebrow, headline, and subheadline reveal with 60ms stagger.
3. 0.4-1.2s: CTAs reveal.
4. 0.8-1.8s: product workspace rises 24px from blurred state.
5. 1.6-2.8s: inbound conversation message appears.
6. 2.4-3.6s: customer intent and missing field are highlighted.
7. 3.3-4.8s: Aurora suggestion appears in a compact side callout.
8. 4.6-6.0s: workflow status or booking card updates.
9. 6.0-8.0s: scene rests; small status indicators may pulse once.

## 4. Scroll reveal

Default:

```css
opacity: 0;
transform: translateY(24px);
filter: blur(6px);
```

To:

```css
opacity: 1;
transform: translateY(0);
filter: blur(0);
```

Use IntersectionObserver or Framer Motion viewport triggers. Trigger once at 15-25% visibility. Do not replay when scrolling slightly up and down.

## 5. Product mockup behavior

- Product screens should use small internal state transitions instead of moving the whole mockup.
- Cursor movement is optional and should be used only to demonstrate a click.
- Tooltips appear near their target; they do not drift independently.
- Notifications should enter once, remain readable, then settle or dismiss.
- Avoid auto-scrolling chat threads unless it communicates a clear workflow.

## 6. Industry cards

Hover:

- Image or product crop scales 1.00 → 1.02 over 240ms.
- Border changes from 6% to 10% black opacity.
- Arrow translates 0 → 3px.
- No card elevation greater than 4px visual depth.

Mobile: no hover dependency. The full card remains tappable.

## 7. Problem/solution rows

As the row enters:

- Product visual reveals first.
- One highlighted problem annotation appears.
- The solution UI state replaces or resolves it.
- Copy reveals 80-120ms later.

Keep each row’s motion under 2.5 seconds.

## 8. Aurora AI section

AI should feel thoughtful, not magical.

- Use “analyzing”, “extracting”, and “suggesting” states.
- Show the source context visually.
- Display confidence only where it can be explained.
- Require an explicit human action before sending or committing.
- Do not use particle explosions, neural-network clichés, or glowing robot visuals.

## 9. Micro-interactions

### Buttons

- Hover: background and border only, 140ms.
- Press: scale to 0.985 for 80ms, optional.
- Loading: preserve width; replace icon or add inline spinner.

### Tabs

- Active indicator moves 180-220ms.
- Content crossfades 160ms.

### Accordions

- Height transition 220ms.
- Chevron rotates 90°.
- Respect native keyboard interaction.

### Navigation dropdown

- Fade + translateY(6px), 160ms.
- Focus moves into menu only through keyboard navigation.

## 10. Reduced motion

Honor `prefers-reduced-motion: reduce`.

- Remove blur and parallax.
- Replace staged hero with immediate final state or 100ms crossfade.
- Stop auto-looping product sequences.
- Keep essential state feedback.

## 11. Performance guardrails

- Prefer transform and opacity.
- Avoid animating layout properties on scroll.
- Keep hero animations under 4 simultaneous high-cost layers.
- Use SVG/CSS for simple callouts.
- Load Lottie only when it produces a meaningful file-size benefit.
- Avoid WebGL at launch unless the scene cannot be achieved efficiently otherwise.

## 12. Motion QA checklist

- Does the motion explain a state or relationship?
- Can every text block be read before it changes?
- Does the page remain usable at 4x CPU slowdown?
- Is reduced-motion mode complete?
- Does mobile receive a simpler composition?
- Are animations paused when the tab is hidden?
