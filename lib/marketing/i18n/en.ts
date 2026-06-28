import { platformSubroutes } from "@/lib/marketing/platform-content";
import { solutionSubroutes } from "@/lib/marketing/solutions-content";

export const marketingContentEn = {
  locale: "en" as const,
  brand: {
    name: "Desklabs",
    tagline: "One Platform. Endless Growth.",
    email: "hello@desklabs.id",
  },
  nav: {
    platform: "Platform",
    solutions: "Solutions",
    resources: "Resources",
    pricing: "Pricing",
    company: "Company",
    signIn: "Sign In",
    demo: "Request Demo",
    viewPlatform: "View Platform",
  },
  hero: {
    badge: "One Platform. Endless Growth.",
    headline: "Run the entire customer journey in one platform.",
    subheadline:
      "From the first conversation to follow-ups, sales, payments, and customer service. Every customer-facing workflow connects in one AI-powered workspace.",
    primaryCta: "Request Demo",
    secondaryCta: "View Platform",
  },
  problem: {
    title: "Too many apps. Too much repetitive work.",
    copy: "Customer-facing teams jump between WhatsApp, Instagram, Facebook, spreadsheets, email, and internal tools. Context gets lost, follow-ups slip, and revenue opportunities disappear.",
    sources: ["WhatsApp", "Instagram", "Facebook", "Spreadsheet", "Email"],
    outcomes: [
      { label: "Scattered context", tone: "warning" as const },
      { label: "Missed follow-ups", tone: "danger" as const },
      { label: "Lost opportunities", tone: "danger" as const },
    ],
  },
  solution: {
    title: "One platform for all customer operations.",
    items: [
      {
        id: "communication",
        label: "Communication",
        description: "Every customer channel lands in one workspace.",
      },
      {
        id: "customer",
        label: "Customer",
        description: "Profiles, history, and context always available.",
      },
      {
        id: "tasks",
        label: "Tasks",
        description: "Operational work becomes a clear priority queue.",
      },
      {
        id: "sales",
        label: "Sales",
        description: "Pipeline and closing workflows stay structured.",
      },
      {
        id: "finance",
        label: "Finance",
        description: "Payments and outstanding balances stay visible.",
      },
      {
        id: "knowledge",
        label: "Knowledge",
        description: "SOPs and team knowledge in one hub.",
      },
      {
        id: "ai",
        label: "AI",
        description: "Summaries, suggestions, and faster decisions.",
      },
    ],
  },
  capabilities: {
    title: "All core capabilities in one platform.",
    items: [
      {
        title: "Communication",
        description: "Reply to every customer channel without switching apps.",
      },
      {
        title: "Customer",
        description: "Keep history, context, and activity in one place.",
      },
      {
        title: "Tasks",
        description: "Turn operational work into a clear priority queue.",
      },
      {
        title: "Sales",
        description: "Manage pipeline, opportunities, and closing cleanly.",
      },
      {
        title: "Finance",
        description: "Track payments, invoices, and outstanding without spreadsheets.",
      },
      {
        title: "Knowledge",
        description: "Unify SOPs, product info, and team knowledge.",
      },
      {
        title: "AI",
        description: "AI helps summarize, suggest actions, and speed decisions.",
      },
      {
        title: "Automation",
        description: "Automate repetitive work without losing human control.",
      },
    ],
  },
  industries: {
    title: "Built for multiple industries.",
    subtitle:
      "Desklabs shares the same core platform, then adapts through solution packs for different industries.",
    items: [
      {
        name: "Travel Operations",
        modules: ["Communication", "Operations", "Finance"],
        status: "available" as const,
      },
      {
        name: "Education Operations",
        modules: ["Enrollment", "Tasks", "Finance"],
        status: "coming_soon" as const,
      },
      {
        name: "Property Operations",
        modules: ["Leads", "Visits", "Payments"],
        status: "coming_soon" as const,
      },
      {
        name: "Healthcare Operations",
        modules: ["Appointments", "Patient Care", "Billing"],
        status: "coming_soon" as const,
      },
      {
        name: "Agency Operations",
        modules: ["Clients", "Campaigns", "Delivery"],
        status: "coming_soon" as const,
      },
      {
        name: "Retail Operations",
        modules: ["Inquiries", "Orders", "Support"],
        status: "coming_soon" as const,
      },
    ],
  },
  journey: {
    title: "From conversation to growth.",
    steps: [
      "Customer reaches out",
      "Team replies from one workspace",
      "AI summarizes customer needs",
      "Tasks and follow-ups are organized",
      "Sales closes and follows through",
      "Finance tracks payments",
      "Customer becomes loyal",
    ],
  },
  comparison: {
    title: "More than a CRM.",
    traditional: {
      title: "Traditional software",
      items: [
        "Stores data",
        "Many separate apps",
        "Passive reports",
        "AI as an add-on",
        "Teams still hunt for context",
      ],
    },
    desklabs: {
      title: "Desklabs",
      items: [
        "Guides work",
        "Everything connected in one platform",
        "Surfaces next actions",
        "AI in every workflow",
        "Customer context always available",
      ],
    },
  },
  trust: {
    title: "Built from real operations.",
    copy: "Desklabs was born from businesses handling conversations, customers, transactions, and follow-ups every day, not from generic software templates.",
    highlights: [
      {
        title: "Built from real daily operations",
        description: "Designed for customer-facing workflows that run every day.",
      },
      {
        title: "Designed for multi-industry workflows",
        description: "Same core platform, adapted through industry solution packs.",
      },
      {
        title: "Ready for customer-facing teams",
        description:
          "Sales, support, operations, and finance share the same customer context.",
      },
      {
        title: "AI-assisted work, human in control",
        description: "AI summarizes and suggests. Teams stay in control.",
      },
    ],
  },
  cta: {
    title: "Ready to run the customer journey in one platform?",
    copy: "Build cleaner, faster, connected customer operations with Desklabs.",
    primary: "Request Demo",
    secondary: "Contact Us",
  },
  footer: {
    platform: [
      { label: "Communication", href: platformSubroutes.communication },
      { label: "Customer", href: platformSubroutes.customer },
      { label: "Sales", href: platformSubroutes.sales },
      { label: "Finance", href: platformSubroutes.finance },
      { label: "Knowledge", href: platformSubroutes.knowledge },
      { label: "Automation", href: platformSubroutes.automation },
      { label: "AI", href: platformSubroutes.ai },
    ],
    solutions: [
      { label: "Travel Operations", href: solutionSubroutes.travel },
      { label: "Education Operations", href: "/solutions#education" },
      { label: "Property Operations", href: "/solutions#property" },
      { label: "Healthcare Operations", href: "/solutions#healthcare" },
      { label: "Agency Operations", href: "/solutions#agency" },
      { label: "Retail Operations", href: "/solutions#retail" },
    ],
    resources: [
      { label: "Documentation", href: "#resources" },
      { label: "Product Updates", href: "#resources" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms" },
    ],
    company: [
      { label: "About", href: "/company" },
      { label: "Demo", href: "/demo" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/company" },
    ],
    columnTitles: {
      platform: "Platform",
      solutions: "Solutions",
      resources: "Resources",
      company: "Company",
    },
  },
} as const;

export type MarketingContentEn = typeof marketingContentEn;
