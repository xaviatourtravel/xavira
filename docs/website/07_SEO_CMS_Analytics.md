# Desklabs SEO, CMS, Analytics, and Experimentation

## 1. SEO strategy

The homepage should target category and outcome terms, not only “CRM”. Build topical authority through product, industry, and problem pages.

### Core topic clusters

- customer operations platform
- omnichannel customer communication
- shared inbox for teams
- CRM for service businesses
- workflow automation for service teams
- AI customer operations
- industry-specific CRM/workflow terms

### Indonesian priority keywords

- CRM bisnis jasa
- CRM WhatsApp Indonesia
- omnichannel inbox Indonesia
- software customer service
- software operasional bisnis
- CRM travel agent
- CRM pendidikan
- CRM properti
- appointment reminder clinic (subject to scope)
- CRM agency

Keyword selection must be validated with search volume and competition before final publishing.

## 2. URL architecture

Use short, stable, English slugs where practical, with localized metadata and copy.

```text
/product/communication
/product/crm
/product/operations
/product/finance
/product/automation
/product/aurora-ai
/industries/travel
/industries/education
/industries/healthcare
/industries/property
/industries/agency
```

Avoid changing URLs when copy language changes.

## 3. Metadata template

Homepage title:

**Desklabs - Customer Operations Platform for Service Businesses**

Indonesian meta description:

**Satukan komunikasi, CRM, operasional, pembayaran, otomatisasi, dan AI dalam satu workspace untuk bisnis layanan modern.**

Industry title:

**Desklabs for {Industry} - {Primary Outcome}**

## 4. Structured data

- Organization
- SoftwareApplication
- Product (only if pricing details are valid)
- FAQPage
- BreadcrumbList
- Article for resources
- VideoObject for product demo

Do not add Review or AggregateRating schema without legitimate source data.

## 5. CMS model

CMS should manage:

- global navigation/footer
- homepage sections
- product pages
- industry pages
- customer stories
- pricing and FAQs
- resources
- announcements
- SEO metadata

Product visuals and animation configuration should remain version-controlled when tightly coupled to frontend behavior.

## 6. Analytics event taxonomy

### Acquisition

- `page_view`
- `industry_page_view`
- `product_page_view`
- `resource_view`

### Engagement

- `hero_demo_play`
- `industry_card_select`
- `product_tab_select`
- `faq_expand`
- `pricing_compare`
- `scroll_depth_50`
- `scroll_depth_90`

### Conversion

- `start_free_click`
- `book_demo_click`
- `demo_form_start`
- `demo_form_submit`
- `signup_start`
- `signup_complete`
- `calendar_booked`

Include source section, page type, language, industry, and experiment variant as properties.

## 7. Primary website KPIs

- Visitor → CTA click rate
- Demo-form completion rate
- Start-free completion rate
- Industry-page assisted conversion
- Hero demo engagement
- Qualified demo rate
- Organic non-brand traffic
- Core Web Vitals pass rate

Do not optimize only for raw leads. Track qualified pipeline and product activation.

## 8. Experiment roadmap

1. Category headline: “Customer Operations Platform” vs “Operating System for Service Businesses”.
2. CTA: Start Free vs Try Desklabs.
3. Hero product scene: neutral industry vs rotating industry contexts.
4. Industry card order based on acquisition segment.
5. Proof style: customer logos vs quantified workflow outcomes.
6. Pricing visibility vs demo-first model.

Run only one major narrative test at a time.

## 9. Content roadmap

Create problem-led content:

- How to manage WhatsApp leads as a team
- CRM vs shared inbox vs helpdesk
- Follow-up system for service businesses
- Customer operations playbooks by industry
- AI with human approval in customer communication
- Migration from spreadsheets and personal messaging accounts

## 10. Privacy and consent

- Use consent management appropriate to tracking stack and jurisdiction.
- Do not send sensitive form data to analytics.
- Document data retention for demo forms.
- Provide privacy, terms, security, and subprocessors pages before enterprise selling.
