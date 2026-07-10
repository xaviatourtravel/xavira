import { platformSubroutes } from "@/lib/marketing/platform-content";
import { marketingHomeAnchors } from "@/lib/marketing/routes";
import { solutionSubroutes } from "@/lib/marketing/solutions-content";

export const marketingContentEn = {
  locale: "en" as const,
  brand: {
    name: "Desklabs",
    tagline: "Customer Operations Platform for modern service businesses.",
    email: "hello@desklabs.id",
  },
  nav: {
    platform: "Platform",
    solutions: "Solutions",
    industries: "Industries",
    pricing: "Pricing",
    resources: "Resources",
    company: "Company",
    signIn: "Sign In",
    startFree: "Start Free",
    seeDemo: "See Demo",
  },
  hero: {
    eyebrow: "Customer Operations Platform",
    headline: "Run your entire customer operation from one calm workspace.",
    subheadline:
      "Unify communication, CRM, operations, payments, automation, and AI without forcing your team to jump between disconnected tools.",
    primaryCta: "Start Free",
    secondaryCta: "See Demo",
    microcopy: "Ready for service, sales, and operations teams.",
  },
  trust: {
    statement: "Built for customer-focused service businesses.",
    industries: ["Travel", "Education", "Healthcare", "Property", "Agency"],
  },
  industries: {
    title: "One platform. Different ways to serve customers.",
    description:
      "Desklabs provides a shared foundation for communication, customer data, workflows, payments, and AI — then adapts it to how each industry operates.",
    cta: "Explore all industry solutions",
    items: [
      {
        id: "travel" as const,
        name: "Travel & Tourism",
        description:
          "From inquiry and quotation through booking, payments, documents, and departure.",
        workflow: "Inquiry → Quotation → Booking → Departure",
        status: "available" as const,
      },
      {
        id: "education" as const,
        name: "Education",
        description:
          "Manage inquiry, admission, parent or student communication, payments, and learning activity.",
        workflow: "Inquiry → Admission → Enrollment → Student Support",
        status: "coming_soon" as const,
      },
      {
        id: "healthcare" as const,
        name: "Healthcare",
        description:
          "Organize patient communication, appointments, reminders, intake, and non-clinical service coordination.",
        workflow: "Inquiry → Appointment → Reminder → Follow-up",
        status: "coming_soon" as const,
      },
      {
        id: "property" as const,
        name: "Property",
        description:
          "Handle leads, viewing schedules, unit interest, follow-up, deals, and payments.",
        workflow: "Lead → Viewing → Negotiation → Deal",
        status: "coming_soon" as const,
      },
      {
        id: "agency" as const,
        name: "Agency & Professional Services",
        description:
          "Connect leads, proposals, project handoff, invoices, and client relationships in one flow.",
        workflow: "Lead → Proposal → Project → Invoice",
        status: "coming_soon" as const,
      },
    ],
  },
  problems: {
    title: "Service businesses should not feel this fragmented.",
    items: [
      {
        problem: "Customer conversations are scattered",
        problemDetail:
          "Teams lose context because WhatsApp, Instagram, email, and other channels run in isolation.",
        solution: "Unified Communication Workspace",
        solutionDetail:
          "Every conversation lands in one workspace with shared assignment, status, and customer context.",
      },
      {
        problem: "Leads and customers fall through the cracks",
        problemDetail:
          "Important information stays locked in personal chats, spreadsheets, manual notes, and team members' heads.",
        solution: "Shared CRM & Customer Timeline",
        solutionDetail:
          "One trusted customer history — conversations, activity, needs, and transactions in one place.",
      },
      {
        problem: "Operational work lives in spreadsheets and disconnected tools",
        problemDetail:
          "Sales, bookings, appointments, projects, payments, and documents lack a single source of truth.",
        solution: "One Connected Operations Workspace",
        solutionDetail:
          "Operational workflows connect to the same customer data without duplicated work.",
      },
      {
        problem: "Follow-up depends on memory and manual work",
        problemDetail:
          "Opportunities are lost not because the product is wrong, but because nothing keeps follow-up on track.",
        solution: "Automation & Aurora AI Assistance",
        solutionDetail:
          "Automation and AI help remind, suggest, and prepare actions — humans stay in control of decisions.",
      },
    ],
  },
  platformCore: {
    title: "Everything your team needs, working as one system.",
    description:
      "Desklabs connects conversations, customer records, operational workflows, payments, and AI. When something changes, the whole team sees the same context.",
    modules: [
      "Communication",
      "CRM",
      "Operations",
      "Finance",
      "Automation",
      "Aurora AI",
      "Analytics",
    ],
  },
  productModules: {
    title: "Core platform modules",
    description: "One connected operating system — not seven separate SaaS tools.",
    items: [
      {
        id: "communication" as const,
        title: "Communication Workspace",
        outcome: "All conversations. One workspace.",
        capabilities: [
          "WhatsApp, Instagram, email, and other channels in one inbox",
          "Assignment, status, and customer context on every thread",
        ],
      },
      {
        id: "crm" as const,
        title: "CRM",
        outcome: "One customer history you can trust.",
        capabilities: [
          "Conversation, activity, and transaction timeline",
          "Internal notes and status changes visible to the team",
        ],
      },
      {
        id: "operations" as const,
        title: "Operations",
        outcome: "Workflows that follow how your business works.",
        capabilities: [
          "Industry-specific operational templates",
          "Bookings, admissions, appointments, projects, and documents",
        ],
      },
      {
        id: "finance" as const,
        title: "Finance",
        outcome: "Clear payments and obligations.",
        capabilities: [
          "Invoices, installments, due dates, and refunds",
          "Customer value in the same operational context",
        ],
      },
      {
        id: "automation" as const,
        title: "Automation",
        outcome: "Reduce repetitive work without losing control.",
        capabilities: [
          "Assignment, reminders, follow-ups, and handoffs",
          "Rules based on business conditions",
        ],
      },
      {
        id: "aurora" as const,
        title: "Aurora AI",
        outcome: "AI that helps teams decide — not take over.",
        capabilities: [
          "Conversation summaries and next-step recommendations",
          "Reply drafts with human approval",
        ],
      },
      {
        id: "analytics" as const,
        title: "Analytics",
        outcome: "Monitor operations with consistent data.",
        capabilities: [
          "Response time, conversion, workload, and revenue",
          "Operational bottlenecks that are easy to audit",
        ],
      },
    ],
  },
  aurora: {
    eyebrow: "Aurora AI",
    title: "Your AI teammate.",
    description:
      "Aurora reads the context your team already has, surfaces what matters, and prepares the next step — without making the workspace feel noisy.",
    reassurance:
      "Your team always reviews and decides every action before it runs.",
    capabilities: [
      "Summarize conversations",
      "Identify intent and missing data",
      "Suggest replies",
      "Match workflows or services",
      "Remind about follow-ups",
      "Explain recommendation reasoning",
    ],
    steps: [
      {
        title: "A customer sends a message",
        description: "The conversation enters the Communication Workspace.",
      },
      {
        title: "Aurora understands the context",
        description: "AI reads history, status, and customer needs.",
      },
      {
        title: "Aurora summarizes or prepares a reply",
        description: "Summaries and draft replies are ready for team review.",
      },
      {
        title: "A human reviews",
        description: "The team verifies before any action runs.",
      },
      {
        title: "A human sends or approves",
        description: "Final decisions stay with your team.",
      },
    ],
    cta: "See Aurora in action",
  },
  workflow: {
    title: "From first conversation to work completed.",
    description:
      "A universal flow that works across industries — with labels that adapt to each business.",
    steps: [
      "Conversation",
      "Qualification",
      "Proposal or Quotation",
      "Operation or Appointment",
      "Payment",
      "Delivery or Service",
      "Follow-up",
    ],
  },
  proof: {
    title: "Fewer app switches. More work completed.",
    disconnected: {
      title: "Disconnected tools",
      items: [
        "Separate inbox per channel",
        "Spreadsheets for tracking",
        "Scattered customer data",
        "Manual follow-up that gets missed",
        "Duplicated work across teams",
      ],
    },
    desklabs: {
      title: "Desklabs",
      items: [
        "One customer context for the whole team",
        "One communication workspace",
        "Connected operations",
        "Follow-up assisted by automation and AI",
        "Shared team visibility",
      ],
    },
    outcomes: [
      "More consistent response time",
      "Follow-up stays on track",
      "Clearer handoffs between teams",
      "More complete customer data",
      "Operations that are easier to audit",
    ],
  },
  pricing: {
    title: "Plans that grow with your team.",
    description:
      "Start with the workspace you need now. Grow without replacing your system.",
    plans: [
      {
        name: "Starter",
        description:
          "For small teams ready to organize communication and customer CRM.",
        cta: "Start Free",
      },
      {
        name: "Growth",
        description:
          "For operations teams that need connected workflows, finance, and automation.",
        cta: "Contact Team",
      },
      {
        name: "Enterprise",
        description:
          "For organizations with multi-team needs, integrations, and custom configuration.",
        cta: "Book Demo",
      },
    ],
    disclaimer:
      "Detailed pricing will be announced. Contact our team to discuss your specific needs.",
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        question: "What is Desklabs?",
        answer:
          "Desklabs is a Customer Operations Platform that helps service businesses manage communication, CRM, operations, finance, automation, and AI in one connected workspace.",
      },
      {
        question: "What types of businesses can use Desklabs?",
        answer:
          "Desklabs is designed for service-based businesses — travel, education, healthcare, property, agency, and other customer-facing businesses handling inquiry, follow-up, and customer operations.",
      },
      {
        question: "Does Desklabs replace WhatsApp?",
        answer:
          "No. Desklabs connects channels like WhatsApp into one workspace so teams can reply, track context, and follow up without losing conversation history.",
      },
      {
        question: "Can Desklabs adapt to different industries?",
        answer:
          "Yes. Desklabs shares the same core platform, then adapts workflows, terminology, and operational templates for each industry.",
      },
      {
        question: "How does Aurora AI work?",
        answer:
          "Aurora reads existing customer context, summarizes conversations, suggests replies, and recommends next steps. Your team always reviews and decides every action.",
      },
      {
        question: "Can our team request a demo?",
        answer:
          "Yes. You can schedule a demo through the demo page or contact our team directly.",
      },
      {
        question: "Is Desklabs already available?",
        answer:
          "The core platform and Travel solution are available. Solution packs for Education, Healthcare, Property, and Agency are in development — contact our team for availability details.",
      },
    ],
  },
  finalCta: {
    title: "Bring every customer operation into one calm workspace.",
    description:
      "Start with the communication workspace, then connect CRM, operations, finance, and AI as your business needs them.",
    reassurance: "No credit card required to try the core workspace.",
    primaryCta: "Start Free",
    secondaryCta: "See Demo",
  },
  footer: {
    statement:
      "Desklabs helps service businesses manage communication, customers, operations, and AI in one calm workspace.",
    platform: [
      { label: "Communication", href: platformSubroutes.communication },
      { label: "Customer", href: platformSubroutes.customer },
      { label: "Sales", href: platformSubroutes.sales },
      { label: "Finance", href: platformSubroutes.finance },
      { label: "Knowledge", href: platformSubroutes.knowledge },
      { label: "Automation", href: platformSubroutes.automation },
      { label: "AI", href: platformSubroutes.ai },
    ],
    industries: [
      { label: "Travel", href: solutionSubroutes.travel },
      { label: "Education", href: "/solutions#education" },
      { label: "Property", href: "/solutions#property" },
      { label: "Healthcare", href: "/solutions#healthcare" },
      { label: "Agency", href: "/solutions#agency" },
    ],
    resources: [
      { label: "FAQ", href: marketingHomeAnchors.faq },
      { label: "Demo", href: "/demo" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy-policy" },
    ],
    company: [
      { label: "About", href: "/company" },
      { label: "Demo", href: "/demo" },
      { label: "Contact", href: "/contact" },
    ],
    columnTitles: {
      platform: "Platform",
      industries: "Industries",
      resources: "Resources",
      company: "Company",
    },
  },
} as const;

export type MarketingContentEn = typeof marketingContentEn;
