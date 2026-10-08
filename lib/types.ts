// Types for the Lead Scout application

export interface CompetitorItem {
  name: string;
  domain: string;
  category: string;
  marketPosition: string;
  whereTargetWins: string[];
  whereCompetitorWins: string[];
  pricingModel: string;
  objectionScript: {
    objection: string;
    response: string;
    killPoint: string;
  };
}

export interface BattlecardSummary {
  whySwitchSummary: string;
  differentiatorPillars: {
    title: string;
    description: string;
  }[];
}

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
  competitors?: CompetitorItem[];
  battlecardSummary?: BattlecardSummary;
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

export type IcpTier = "tier_1" | "tier_2" | "tier_3";

export interface IcpCriterionBreakdown {
  id: "headcount" | "business_model" | "tech_stack" | "pain_points";
  title: string;
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: "excellent" | "good" | "fair" | "poor";
  reason: string;
  matchedSignals: string[];
}

export interface IcpScoreResult {
  totalScore: number;
  tier: IcpTier;
  tierLabel: string;
  verdict: string;
  recommendedAction: string;
  priorityLevel: "Critical" | "High" | "Moderate" | "Low";
  breakdown: IcpCriterionBreakdown[];
  evaluatedAt: string;
}

export interface IcpProfileSettings {
  targetHeadcounts: string[];
  targetBusinessModels: string[];
  targetKeywords: string[];
  minQualificationScore: number;
}


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
  competitors: [
    {
      name: "Adyen",
      domain: "adyen.com",
      category: "Primary Enterprise Alternative",
      marketPosition: "Unified global omnichannel payments platform favoured by massive enterprises (McDonald's, Spotify, Uber) for lower interchange fees and unified POS.",
      whereTargetWins: [
        "Superior developer experience and time-to-first-transaction (hours vs weeks)",
        "Stripe Connect marketplace onboarding and multi-party payout automation",
        "Self-serve transparency without minimum volume commitments",
      ],
      whereCompetitorWins: [
        "Interchange++ pricing with lower take rates on massive global volume",
        "Direct acquiring bank status in key jurisdictions with physical in-store terminal fleet",
      ],
      pricingModel: "Interchange++ pricing with tiered volume thresholds (custom quote)",
      objectionScript: {
        objection: "We already use Adyen because our finance team negotiated lower interchange rates for our volume.",
        response: "Completely understand — Adyen is formidable for straightforward point-of-sale volume. Where companies partner with us is when their product team wants to launch usage-based subscriptions or marketplace splits, which take quarters of custom dev on Adyen. We can run alongside your core processing without disrupting negotiated processing rates.",
        killPoint: "Keep negotiated interchange rates while unlocking rapid product velocity.",
      },
    },
    {
      name: "Checkout.com",
      domain: "checkout.com",
      category: "High-Growth Global Challenger",
      marketPosition: "Cloud-native payments processor focusing on enterprise digital merchants with modular acquiring and granular acceptance telemetry.",
      whereTargetWins: [
        "Vastly larger financial suite (Billing, Tax, Invoicing, Corporate Cards, Atlas)",
        "Stripe Radar ML models trained on hundreds of billions in global transaction history",
        "Unrivalled third-party SaaS ecosystem & turnkey pre-built integrations",
      ],
      whereCompetitorWins: [
        "Deep domestic processing in MENA and APAC regions",
        "Dedicated account engineering and custom acceptance optimization consulting",
      ],
      pricingModel: "Custom volume-based pricing with modular capability licensing",
      objectionScript: {
        objection: "We're evaluating Checkout.com for their regional processing fees in international markets.",
        response: "Checkout.com has strong regional routing in specific markets. However, companies adopting them find themselves having to rebuild their entire billing and tax infrastructure from scratch. Stripe eliminates that hidden engineering cost by packaging local payment methods, automated tax collection, and fraud prevention into a unified pipeline.",
        killPoint: "Eliminates multi-vendor fragmentation and tax compliance overhead.",
      },
    },
    {
      name: "Paddle",
      domain: "paddle.com",
      category: "Merchant of Record (MoR) Alternative",
      marketPosition: "Merchant of Record platform handling global tax compliance, liabilities, and billing for digital SaaS companies.",
      whereTargetWins: [
        "Full control over customer data, direct merchant accounts, and customized checkout branding",
        "Significantly lower take rate (2.9% + 30¢ vs Paddle's 5% + 50¢)",
        "Complete enterprise flexibility for bespoke contract billing and hybrid sales-assisted tiers",
      ],
      whereCompetitorWins: [
        "Takes on legal liability for global VAT/sales tax filing automatically as Merchant of Record",
        "Simpler compliance for early-stage digital product sellers without local tax entities",
      ],
      pricingModel: "Flat 5% + 50¢ per transaction (all-inclusive Merchant of Record)",
      objectionScript: {
        objection: "We use Paddle so we don't have to deal with global sales tax and VAT filing.",
        response: "That convenience makes total sense at early stage. But as you pass $5M ARR, that 5% take rate becomes an immense margin penalty ($100k+ in unnecessary fees). With Stripe Tax and automated reporting, you retain full ownership of your customer relationships and recover over 2% directly to your bottom line.",
        killPoint: "Recover 2%+ gross margin while retaining automated tax calculation.",
      },
    },
  ],
  battlecardSummary: {
    whySwitchSummary: "While competitors compete on raw interchange basis points or take on reseller liability at a steep 5% cut, Stripe offers the only unified financial infrastructure that scales seamlessly from developer MVP to Fortune 500 multi-entity commerce without re-architecting your stack.",
    differentiatorPillars: [
      {
        title: "Ecosystem Velocity",
        description: "Launch new monetisation models (usage-based, seats, add-ons) in days rather than quarters of bespoke engineering.",
      },
      {
        title: "Fraud Prevention at Scale",
        description: "Stripe Radar ML is trained across millions of global businesses, lowering false positives and boosting card authorization rates.",
      },
      {
        title: "Developer First, Enterprise Ready",
        description: "Complete REST & GraphQL APIs with 99.999% uptime, webhooks idempotency, and comprehensive SDKs in every language.",
      },
    ],
  },
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
