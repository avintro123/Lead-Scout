// Types for the Lead Scout application

export interface CompanyDossier {
  companyName: string;
  domain: string;
  oneSentenceSummary: string;
  tagline: string;
  targetAudience: string;
  estimatedBusinessModel: string;
  estimatedHeadcount: string;
  industryTags: string[];
  valuePropositions: string[];
  techTags: string[];
  top3PainPoints: string[];
  keyFeatures: string[];
}

export interface OutreachEmail {
  subject: string;
  body: string;
  type: "cold_open" | "value_add" | "follow_up" | "linkedin_inmail";
  label: string;
}

export interface ScoutResult {
  dossier: CompanyDossier;
  emails: OutreachEmail[];
  rawContent?: string;
  timestamp: string;
}

export interface LeadRecord {
  id: string;
  domain: string;
  company_name: string;
  objective: string;
  dossier_json: ScoutResult;
  created_at: string;
}

export type OutreachObjective =
  | "client_acquisition"
  | "partnership_inquiry"
  | "tech_stack_audit";

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "running" | "complete" | "error";
  timestamp: string | null;
}

export const OBJECTIVES: Record<OutreachObjective, string> = {
  client_acquisition: "Client Acquisition",
  partnership_inquiry: "Partnership Inquiry",
  tech_stack_audit: "Tech Stack Audit",
};

export const MOCK_DOSSIER: CompanyDossier = {
  companyName: "Stripe",
  domain: "stripe.com",
  oneSentenceSummary:
    "Stripe is a financial infrastructure platform that provides APIs for online payment processing and commerce solutions for internet businesses of every size.",
  tagline: "Financial infrastructure for the internet",
  targetAudience:
    "Internet businesses, SaaS companies, marketplaces, and platforms needing payment infrastructure",
  estimatedBusinessModel:
    "Transaction-based fees (2.9% + 30¢ per transaction) with premium add-ons for Billing, Connect, Radar, and Atlas",
  estimatedHeadcount: "8,000+",
  industryTags: ["FinTech", "Payments", "Developer Tools", "B2B SaaS"],
  valuePropositions: [
    "Unified API for payments, subscriptions, and financial services",
    "Global reach with 135+ currencies and dozens of payment methods",
    "Developer-first approach with best-in-class documentation",
    "Built-in fraud prevention with Stripe Radar ML models",
  ],
  techTags: ["React", "Ruby", "Go", "AWS", "Machine Learning", "REST API", "GraphQL"],
  top3PainPoints: [
    "Complex enterprise billing workflows still require significant custom development despite Stripe Billing",
    "Competitive pressure from Adyen and modern payment orchestration layers that offer lower rates for high-volume merchants",
    "Developer adoption growth slowing as competing platforms improve their DX and offer more competitive pricing",
  ],
  keyFeatures: [
    "Stripe Payments",
    "Stripe Billing",
    "Stripe Connect",
    "Stripe Radar",
    "Stripe Atlas",
    "Stripe Treasury",
  ],
};

export const MOCK_EMAILS: OutreachEmail[] = [
  {
    type: "cold_open",
    label: "Initial outreach",
    subject: "Cutting Stripe's billing complexity by 60% for enterprise clients",
    body: `Hi [Name],

I noticed Stripe's Billing product has been gaining enterprise traction — impressive momentum. However, I've been hearing from several high-volume merchants that complex billing workflows (usage-based + tiered + hybrid models) still require 4-6 weeks of custom development on top of Stripe Billing.

We've built a billing orchestration layer that sits on top of Stripe's API and reduces that implementation time to under 3 days — without changing your payment processor.

Would a 15-minute call next week make sense to explore whether this could accelerate your enterprise billing adoption?

Best,
[Your Name]`,
  },
  {
    type: "value_add",
    label: "Value proposition",
    subject: "3 patterns we're seeing in enterprise billing (relevant to Stripe)",
    body: `Hi [Name],

Following up on my previous note. I wanted to share three patterns we're seeing across the enterprise billing space that directly relate to Stripe's positioning:

1. Hybrid pricing models are becoming table stakes — 73% of SaaS companies now offer usage-based components, but most billing systems can't handle the complexity natively.

2. Revenue recognition automation is the #1 requested feature from CFOs evaluating billing platforms.

3. Payment orchestration is fragmenting the market — companies want processor-agnostic billing that can route intelligently.

We've helped companies like [Similar Company] navigate these exact challenges while keeping Stripe as their core processor.

Happy to share a 2-page case study if useful.

Best,
[Your Name]`,
  },
  {
    type: "follow_up",
    label: "Follow-up",
    subject: "Re: Quick question about Stripe's enterprise billing roadmap",
    body: `Hi [Name],

I know inboxes get crowded — just wanted to bump this once more.

The TL;DR: We help Stripe-powered companies reduce billing implementation time by 60% for complex enterprise scenarios. No processor switch needed.

If the timing isn't right, totally understand. But if this is even tangentially relevant to what your team is building, I'd love 15 minutes on your calendar.

Either way, wishing you and the Stripe team continued success.

Best,
[Your Name]`,
  },
  {
    type: "linkedin_inmail",
    label: "LinkedIn message",
    subject: "Enterprise billing complexity → solved",
    body: `Hey [Name],

Huge fan of what Stripe has built — the developer experience is genuinely best-in-class.

Quick question: are you seeing enterprise clients struggle with complex billing workflows (hybrid pricing, usage-based tiers, multi-entity billing)?

We've built a thin orchestration layer that sits on top of Stripe's API and cuts implementation time from weeks to days. Several Stripe-powered companies are already using it.

Would love to share what we're seeing in the market. Open to a quick chat?`,
  },
];
