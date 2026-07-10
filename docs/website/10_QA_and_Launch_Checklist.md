# Desklabs Website QA and Launch Checklist

## Strategy and claims

- [ ] Homepage describes a horizontal service-business platform.
- [ ] Travel appears as an industry, not the entire product identity.
- [ ] Every product capability shown exists or is clearly labeled upcoming.
- [ ] No fabricated customer logos, numbers, testimonials, or certifications.
- [ ] Healthcare messaging is limited to approved non-clinical use cases.
- [ ] AI claims state human control and do not imply unsupported autonomy.

## Content

- [ ] Hero communicates category, audience, and outcome within 8 seconds.
- [ ] Each section has one primary idea.
- [ ] CTA labels are consistent.
- [ ] Indonesian copy is natural, not literal translation.
- [ ] English copy is independently edited.
- [ ] All dates, prices, product names, and links are current.
- [ ] No placeholder or lorem ipsum remains.

## Visual design

- [ ] Product visuals are original Desklabs assets.
- [ ] Reference assets are not published.
- [ ] Section rhythm matches the approved storyboard.
- [ ] Gradients are accents, not backgrounds for every section.
- [ ] Shadows remain soft and rare.
- [ ] Typography scale is consistent.
- [ ] Mobile compositions are designed, not scaled desktop scenes.

## Motion

- [ ] Hero motion plays once and settles.
- [ ] Text remains readable before any state changes.
- [ ] `prefers-reduced-motion` is complete.
- [ ] Animations pause when offscreen or tab is hidden.
- [ ] No motion causes layout shift.
- [ ] Mobile uses reduced complexity.

## Responsive

Test at minimum:

- [ ] 360×800
- [ ] 390×844
- [ ] 768×1024
- [ ] 1024×768
- [ ] 1366×768
- [ ] 1440×900
- [ ] 1920×1080

Check:

- [ ] Navigation and menus
- [ ] Hero copy wrapping
- [ ] CTA wrapping
- [ ] Product visual crop
- [ ] Industry cards
- [ ] Tables/pricing
- [ ] Footer

## Accessibility

- [ ] One H1 per page.
- [ ] Heading order is logical.
- [ ] Keyboard navigation works.
- [ ] Focus is visible.
- [ ] Contrast meets WCAG AA.
- [ ] Images have correct alt behavior.
- [ ] Demo video has captions/transcript.
- [ ] Forms expose labels and errors.
- [ ] Target size is sufficient on mobile.
- [ ] No information depends on color or motion alone.

## Performance

- [ ] Mobile LCP < 2.5 seconds at p75 target.
- [ ] INP < 200ms target.
- [ ] CLS < 0.1.
- [ ] Correct `sizes` for responsive images.
- [ ] AVIF/WebP delivered.
- [ ] Below-fold media lazy-loaded.
- [ ] Fonts subset and limited to required weights.
- [ ] Static hero first frame is server-rendered.
- [ ] Third-party scripts are audited.

## SEO

- [ ] Unique title and description per page.
- [ ] Canonical URLs.
- [ ] hreflang for localized pages.
- [ ] Open Graph and Twitter images.
- [ ] XML sitemap and robots.
- [ ] Structured data validated.
- [ ] No accidental noindex.
- [ ] Redirects tested.
- [ ] 404 and 500 pages styled.

## Analytics

- [ ] CTA events verified.
- [ ] Demo-form start and submit tracked.
- [ ] Signup funnel tracked.
- [ ] Industry/product page properties included.
- [ ] Campaign parameters retained.
- [ ] Internal traffic filtering configured.
- [ ] Consent behavior verified.
- [ ] Sensitive form values never sent to analytics.

## Forms

- [ ] Server-side validation.
- [ ] Spam protection.
- [ ] Success and failure states.
- [ ] Confirmation email.
- [ ] CRM/task handoff.
- [ ] Calendar flow tested.
- [ ] Duplicate submissions handled.

## Legal and trust

- [ ] Privacy policy.
- [ ] Terms.
- [ ] Security overview.
- [ ] Subprocessor list if applicable.
- [ ] Cookie/consent notice if required.
- [ ] Corporate contact details.
- [ ] Trademark and logo permissions.

## Launch gates

- [ ] Founder/product approval.
- [ ] Design approval.
- [ ] Copy approval.
- [ ] Engineering approval.
- [ ] Security/legal review.
- [ ] Analytics verified in production.
- [ ] Rollback plan documented.
- [ ] Monitoring and uptime alerts active.
