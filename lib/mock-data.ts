import { CompanyDossier, OutreachEmail, ScoutResult, OutreachObjective } from "./types";

export interface CompanyPreset {
  domain: string;
  dossier: CompanyDossier;
  emails: Record<OutreachObjective, OutreachEmail[]>;
}

export const PRESET_COMPANIES: Record<string, CompanyPreset> = {
  "stripe.com": {
    domain: "stripe.com",
    dossier: {
      companyName: "Stripe",
      domain: "stripe.com",
      oneSentenceSummary:
        "Stripe is a financial infrastructure platform that provides APIs for online payment processing, subscription management, and global commerce for internet businesses of every scale.",
      tagline: "Financial infrastructure for the internet",
      targetAudience:
        "Internet businesses, enterprise platforms, B2B SaaS companies, and digital marketplaces worldwide.",
      estimatedBusinessModel:
        "Usage-based transaction fees (2.9% + 30¢) plus recurring subscription tiers for Billing, Connect, Radar, and Treasury.",
      estimatedHeadcount: "8,000+ employees",
      industryTags: ["FinTech", "Payments", "Developer Tools", "Financial Infrastructure"],
      valuePropositions: [
        "Single API integration for global payments, payouts, and compliance",
        "Developer-first ecosystem with 99.999% uptime and rich SDKs",
        "Built-in machine learning fraud prevention (Stripe Radar)",
        "Turnkey support for 135+ currencies and 40+ local payment methods",
      ],
      techTags: ["React", "Ruby", "Go", "AWS", "Machine Learning", "REST API", "GraphQL", "PostgreSQL"],
      top3PainPoints: [
        "Enterprise billing custom workflows (hybrid usage-based + minimum commit contracts) still require weeks of custom engineering on top of Stripe Billing.",
        "Margin sensitivity among high-volume enterprise merchants facing aggressive pricing from Adyen and multi-processor orchestration tools.",
        "Developer friction when migrating multi-entity merchant hierarchies across international tax jurisdictions.",
      ],
      keyFeatures: [
        "Stripe Payments",
        "Stripe Billing & Invoicing",
        "Stripe Connect (Marketplaces)",
        "Stripe Radar (Fraud Prevention)",
        "Stripe Atlas (Incorporation)",
        "Stripe Financial Connections",
      ],
    },
    emails: {
      client_acquisition: [
        {
          type: "cold_open",
          label: "Initial Outreach",
          subject: "Cutting enterprise billing custom code by 60% on Stripe",
          body: `Hi [Name],

I noticed Stripe Billing continues to capture massive enterprise market share. However, several enterprise GTM leaders have mentioned that setting up hybrid pricing (usage thresholds + prepaid minimums) still drains 3-5 weeks of custom engineering per enterprise deal.

We built a lightweight orchestration layer that syncs custom contract terms directly into Stripe Billing's API in under 24 hours — without requiring bespoke webhook pipelines.

Would you be open to a 10-minute chat next Tuesday to see if this could accelerate enterprise deal velocity?

Best regards,
[Your Name]`,
        },
        {
          type: "value_add",
          label: "Strategic Angle",
          subject: "3 friction patterns in enterprise billing adoption (and how to fix them)",
          body: `Hi [Name],

Following up on my note regarding Stripe's enterprise billing workflows. We recently surveyed 40 SaaS engineering teams processing over $20M on Stripe, and three recurring friction points surfaced:

1. Hybrid contract amendments require engineering intervention 82% of the time.
2. Multi-subsidiary consolidated invoicing creates reconciliation overhead across Stripe accounts.
3. Churn risk escalates when merchant engineering teams struggle with custom webhook error handling.

We solved this exact workflow for high-volume Stripe merchants. Happy to share a quick 2-page benchmark breakdown if helpful.

Best,
[Your Name]`,
        },
        {
          type: "linkedin_inmail",
          label: "LinkedIn InMail",
          subject: "Enterprise billing velocity on Stripe",
          body: `Hey [Name],

Huge admiration for Stripe's developer experience and product cadence.

Quick question: are your enterprise onboarding teams seeing friction around complex usage-based contract structures that require bespoke engineering?

We've built an integration layer on Stripe Billing that turns weeks of custom webhook logic into a clean 1-click sync. Would love to share brief field notes if relevant.`,
        },
        {
          type: "follow_up",
          label: "Closing Touch",
          subject: "Re: Enterprise billing velocity on Stripe",
          body: `Hi [Name],

Understood your inbox is demanding. If streamlining enterprise billing contracts isn't a current focus, no worries at all.

If this touches your team's roadmap later this quarter, feel free to pull this thread back up.

Wishing you and the Stripe team continued momentum.

Best,
[Your Name]`,
        },
      ],
      partnership_inquiry: [
        {
          type: "cold_open",
          label: "Partnership Proposal",
          subject: "Certified integration proposal: Automated contract billing for Stripe",
          body: `Hi [Name],

We're exploring a technology partnership with Stripe's App Marketplace. Our platform solves the last-mile contract billing gap for enterprise Stripe customers, automating complex CPQ-to-Stripe syncs.

We'd love to discuss certifying this integration to co-market to mutual mid-market and enterprise accounts.

Do you have 15 minutes this week for a brief partnership discovery call?

Best,
[Your Name]`,
        },
        {
          type: "value_add",
          label: "Ecosystem Alignment",
          subject: "Driving Stripe volume through automated enterprise renewals",
          body: `Hi [Name],

Following up on ecosystem alignment: our joint customers have seen a 14% lift in on-time invoice settlements by automating tier thresholds through Stripe Billing.

We'd love to share the technical specs and explore formal App Marketplace listing.

Best,
[Your Name]`,
        },
        {
          type: "linkedin_inmail",
          label: "LinkedIn Partnership",
          subject: "Stripe App Marketplace integration",
          body: `Hi [Name], reaching out regarding a technology integration that complements Stripe Billing for enterprise B2B accounts. Would love to connect with your platform partnerships team.`,
        },
        {
          type: "follow_up",
          label: "Follow-up",
          subject: "Re: Stripe integration partnership",
          body: `Hi [Name], circling back briefly. Happy to work through your partner portal or schedule a brief sync when timing allows. Best, [Your Name]`,
        },
      ],
      tech_stack_audit: [
        {
          type: "cold_open",
          label: "Tech Audit",
          subject: "Webhook latency & reconciliation audit for high-volume Stripe events",
          body: `Hi [Name],

We recently analyzed telemetry across distributed event ingestion pipelines interfacing with Stripe webhooks under high concurrency (>15k events/sec).

We identified key retry optimization strategies that eliminate idempotency conflicts during sudden traffic spikes.

Would a 10-minute technical review be of interest to your infrastructure team?

Best,
[Your Name]`,
        },
        {
          type: "value_add",
          label: "Benchmark Data",
          subject: "Webhook resiliency benchmark findings",
          body: `Hi [Name], sharing the benchmark summary on payment event dead-letter queue architectures and how to prevent backpressure cascades. Happy to send the full architecture doc. Best, [Your Name]`,
        },
        {
          type: "linkedin_inmail",
          label: "InMail Audit",
          subject: "Event pipeline resiliency review",
          body: `Hey [Name], noticed your team's work on Stripe's core infrastructure. We recently published an audit on webhook idempotency at scale — happy to share if helpful.`,
        },
        {
          type: "follow_up",
          label: "Follow-up",
          subject: "Re: Webhook resiliency audit",
          body: `Hi [Name], just closing the loop on our infra telemetry notes. Wishing you all the best. [Your Name]`,
        },
      ],
    },
  },
  "notion.so": {
    domain: "notion.so",
    dossier: {
      companyName: "Notion",
      domain: "notion.so",
      oneSentenceSummary:
        "Notion is a connected workspace platform combining documents, wikis, project management, and AI-powered knowledge synthesis for modern teams.",
      tagline: "The connected workspace for your wiki, docs & projects",
      targetAudience:
        "Knowledge workers, product and engineering teams, startups, and enterprise organizations seeking to unify fragmented knowledge silos.",
      estimatedBusinessModel:
        "Freemium SaaS with tiered per-seat monthly subscriptions (Plus, Business, Enterprise) and an AI add-on fee ($8-$10/user/mo).",
      estimatedHeadcount: "600+ employees",
      industryTags: ["Productivity", "Collaboration", "Knowledge Management", "AI Workspace"],
      valuePropositions: [
        "All-in-one flexibility replacing fragmented tools (Google Docs, Confluence, Trello, Jira)",
        "Deep relational databases with flexible timeline, board, calendar, and list views",
        "Native AI search across organizational workspace documents and connected third-party tools",
        "Vibrant creator community with thousands of modular templates and workflows",
      ],
      techTags: ["React", "TypeScript", "Node.js", "Kotlin", "PostgreSQL", "AWS", "Vector Databases"],
      top3PainPoints: [
        "Enterprise permissions and granular audit logging complexity as companies scale beyond 1,000 seats.",
        "Performance lag on expansive databases containing tens of thousands of relational records.",
        "Competition from specialized project management suites (Linear, Jira) for engineering team adoption.",
      ],
      keyFeatures: [
        "Connected Wikis & Knowledge Base",
        "Relational Project Tracking",
        "Notion AI Q&A and Writer",
        "Notion Calendar",
        "Custom Workflow Automations",
        "Workspace API & Connectors",
      ],
    },
    emails: {
      client_acquisition: [
        {
          type: "cold_open",
          label: "Initial Outreach",
          subject: "Accelerating Notion's enterprise engineering team adoption",
          body: `Hi [Name],

Notion is the gold standard for workspace wikis, but many engineering leaders still default to Jira or Linear for active sprint cycles due to git branch bi-directional sync gaps.

We built a developer workflow bridge that auto-links Notion project items directly to GitHub PR states and deployment pipelines with zero manual status updates.

Would you be open to a 10-minute walkthrough next week?

Best regards,
[Your Name]`,
        },
        {
          type: "value_add",
          label: "Strategic Angle",
          subject: "Engineering adoption benchmark: Keeping devs inside Notion",
          body: `Hi [Name],

Following up on developer engagement in Notion: teams we surveyed noted that engineers spend 28% less time updating sprint docs when GitHub commit activity reflects into Notion databases automatically.

We've streamlined this for modern engineering orgs. Happy to share a quick preview if this aligns with your product goals.

Best,
[Your Name]`,
        },
        {
          type: "linkedin_inmail",
          label: "LinkedIn InMail",
          subject: "Developer workflow integration for Notion",
          body: `Hey [Name], huge fan of Notion's AI workspace expansion. Quick question: are enterprise engineering workflows a key growth frontier for your team this quarter? We've built tooling that keeps developers engaged inside Notion. Would love to share brief notes.`,
        },
        {
          type: "follow_up",
          label: "Closing Touch",
          subject: "Re: Developer workflow integration for Notion",
          body: `Hi [Name], understand your priorities are full. If engineering workflow bridges become relevant later, feel free to ping me anytime. Continued success to the Notion team! Best, [Your Name]`,
        },
      ],
      partnership_inquiry: [
        {
          type: "cold_open",
          label: "Partnership Pitch",
          subject: "Integration partner inquiry: Deep code sync for Notion",
          body: `Hi [Name], reaching out to explore an official integration partnership on the Notion Connections gallery to bring automated DevOps sync into Notion databases. Do you have 15 minutes for a brief intro? Best, [Your Name]`,
        },
        {
          type: "value_add",
          label: "Co-Marketing Angle",
          subject: "Mutual case study: Enterprise engineering on Notion",
          body: `Hi [Name], sharing brief stats on our 4,000+ mutual users who sync development tasks into Notion daily. Would love to explore an official integration spotlight. Best, [Your Name]`,
        },
        {
          type: "linkedin_inmail",
          label: "InMail Partnership",
          subject: "Notion Connections ecosystem partnership",
          body: `Hey [Name], would love to connect regarding an integration partnership with Notion's platform ecosystem. Open to a brief chat?`,
        },
        {
          type: "follow_up",
          label: "Follow-up",
          subject: "Re: Notion integration partnership",
          body: `Hi [Name], touching base once more. Let me know if there's someone else on the team better suited for partnership discovery. Best, [Your Name]`,
        },
      ],
      tech_stack_audit: [
        {
          type: "cold_open",
          label: "Architecture Audit",
          subject: "Block-level sync optimization for large Notion workspaces",
          body: `Hi [Name], we conducted research on high-throughput collaborative document sync engines and state reconciliation under intermittent mobile connectivity. Happy to share our technical write-up with your client engineering team. Best, [Your Name]`,
        },
        {
          type: "value_add",
          label: "Technical Specs",
          subject: "CRDT & operational transformation benchmarks",
          body: `Hi [Name], sharing the benchmark notes on offline-first database sync latency. Hope this provides value to your infrastructure engineers. Best, [Your Name]`,
        },
        {
          type: "linkedin_inmail",
          label: "LinkedIn Audit",
          subject: "Sync engine architecture write-up",
          body: `Hey [Name], loved your engineering team's writeup on database architecture. We compiled complementary benchmarks on client-side state sync. Happy to share!`,
        },
        {
          type: "follow_up",
          label: "Follow-up",
          subject: "Re: Sync engine architecture",
          body: `Hi [Name], closing the loop here. Best wishes to the Notion team. [Your Name]`,
        },
      ],
    },
  },
  "linear.app": {
    domain: "linear.app",
    dossier: {
      companyName: "Linear",
      domain: "linear.app",
      oneSentenceSummary:
        "Linear is a purpose-built product management and issue tracking system designed for high-performance software teams who value speed, keyboard-first workflows, and craft.",
      tagline: "The purpose-built tool for modern software teams",
      targetAudience:
        "Software engineers, product managers, designers, and high-velocity engineering organizations.",
      estimatedBusinessModel:
        "Tiered per-seat subscription SaaS (Free, Standard $8/mo, Pro $12/mo, Enterprise $16/mo) with annual billing discounts.",
      estimatedHeadcount: "70+ employees",
      industryTags: ["Developer Tools", "Product Management", "Software Engineering", "Enterprise B2B"],
      valuePropositions: [
        "Uncompromising client performance with sub-50ms local-first interactions",
        "Streamlined keyboard-driven ergonomics eliminating clicks and context switching",
        "Automated GitHub, GitLab, and Slack synchronization for frictionless updates",
        "Opinionated workflow defaults that cultivate disciplined engineering rituals",
      ],
      techTags: ["React", "TypeScript", "IndexedDB", "WebSockets", "Node.js", "GraphQL", "Tailwind CSS"],
      top3PainPoints: [
        "Cross-functional enterprise reporting for non-technical stakeholders (finance, marketing, legal) who find Linear's dev-centric model too sparse.",
        "Enterprise compliance requirements (complex data residency, SOC2 type II audit trails, custom role RBAC) for legacy IT procurement.",
        "Pressure from all-in-one corporate suites attempting to bundle issue tracking into broader HR/workplace packages.",
      ],
      keyFeatures: [
        "Linear Issues & Projects",
        "Cycles & Automated Sprints",
        "Roadmaps & Initiative Tracking",
        "Customer Requests (Linear Asks)",
        "Linear Insights & Analytics",
        "Mobile & Desktop Native Clients",
      ],
    },
    emails: {
      client_acquisition: [
        {
          type: "cold_open",
          label: "Initial Outreach",
          subject: "Executive-ready roadmap reporting without compromising Linear's speed",
          body: `Hi [Name],

Linear is celebrated across the developer community for its extraordinary speed and keyboard-first design. However, several Head of Product leads have shared that translating Linear cycle progress into non-technical board and executive summaries still requires manual slide preparation.

We built an automated executive rollup view that renders live Linear milestones into executive-ready progress briefs — without cluttering the core Linear workspace.

Would you be open to a 10-minute look next week?

Best regards,
[Your Name]`,
        },
        {
          type: "value_add",
          label: "Strategic Angle",
          subject: "How top engineering teams keep executives informed from Linear data",
          body: `Hi [Name],

Following up on executive visibility from Linear: engineering leaders we spoke with save an estimated 3.5 hours per cycle by automating initiative summaries directly from Linear's GraphQL API.

We've packaged this into a zero-configuration dashboard. Happy to send over a 2-minute demo link if helpful.

Best,
[Your Name]`,
        },
        {
          type: "linkedin_inmail",
          label: "LinkedIn InMail",
          subject: "Linear executive rollup workflows",
          body: `Hey [Name], huge respect for Linear's craft and velocity. Quick question: are non-technical executive reporting workflows a recurring request from your growing enterprise customers? We built something lightweight that bridges that gap. Open to a brief chat?`,
        },
        {
          type: "follow_up",
          label: "Closing Touch",
          subject: "Re: Linear executive rollup workflows",
          body: `Hi [Name], no worries if timing isn't aligned. Always rooting for Linear's continued success and craft. Best, [Your Name]`,
        },
      ],
      partnership_inquiry: [
        {
          type: "cold_open",
          label: "Integration Inquiry",
          subject: "Linear Integration: Executive summary generator",
          body: `Hi [Name], reaching out to submit an integration for the Linear Integrations ecosystem that auto-generates stakeholder updates from Linear initiatives. Would love to share technical specs with your ecosystem team. Best, [Your Name]`,
        },
        {
          type: "value_add",
          label: "Mutual Value",
          subject: "Unlocking enterprise tier expansion for Linear customers",
          body: `Hi [Name], our mutual customers have noted this integration made enterprise procurement approval significantly faster by satisfying executive reporting needs. Happy to share joint metrics. Best, [Your Name]`,
        },
        {
          type: "linkedin_inmail",
          label: "InMail Partner",
          subject: "Linear ecosystem partner proposal",
          body: `Hey [Name], would love to connect regarding an integration that strengthens Linear's enterprise appeal. Open to a quick sync?`,
        },
        {
          type: "follow_up",
          label: "Follow-up",
          subject: "Re: Linear ecosystem partnership",
          body: `Hi [Name], closing the loop here. Feel free to reach out anytime. [Your Name]`,
        },
      ],
      tech_stack_audit: [
        {
          type: "cold_open",
          label: "Client Telemetry Audit",
          subject: "IndexedDB sync optimization insights for high-frequency issue updates",
          body: `Hi [Name], we conducted an audit on local-first synchronization patterns with WebSocket reconnect strategies under adverse network packet loss. Happy to share our technical report with your sync team. Best, [Your Name]`,
        },
        {
          type: "value_add",
          label: "Technical Specs",
          subject: "Local-first state resolution metrics",
          body: `Hi [Name], sharing the benchmark numbers on client memory footprint during multi-tab sync. Hope this is valuable to your team. Best, [Your Name]`,
        },
        {
          type: "linkedin_inmail",
          label: "LinkedIn Tech",
          subject: "Local-first sync engine writeup",
          body: `Hey [Name], admired Linear's offline-first architecture. We compiled complementary telemetry on WebSocket reconnect cascades — happy to share!`,
        },
        {
          type: "follow_up",
          label: "Follow-up",
          subject: "Re: Local-first sync engine",
          body: `Hi [Name], just following up. Wishing you and the Linear team all the best. [Your Name]`,
        },
      ],
    },
  },
};

export function getFallbackDossier(
  domainInput: string,
  objective: OutreachObjective = "client_acquisition",
  scrapedContent?: string
): ScoutResult {
  const cleanDomain = domainInput
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .trim();

  // If matched in presets, return preset
  if (PRESET_COMPANIES[cleanDomain]) {
    const preset = PRESET_COMPANIES[cleanDomain];
    return {
      dossier: preset.dossier,
      emails: preset.emails[objective] || preset.emails.client_acquisition,
      rawContent: scrapedContent,
      timestamp: new Date().toISOString(),
    };
  }

  // Synthesize dynamic realistic company dossier from domain and scraped text
  const companyNameFromDomain = cleanDomain
    .split(".")[0]
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Extract hints if scrapedContent is available
  let summary = `${companyNameFromDomain} is a digital-first organization operating via ${cleanDomain}, delivering technology-driven products and services to business and consumer clients.`;
  let tagline = `Empowering modern workflows with ${companyNameFromDomain}`;

  if (scrapedContent && scrapedContent.length > 50) {
    const firstLine = scrapedContent.split("\n").find((l) => l.trim().length > 30);
    if (firstLine) {
      summary = firstLine.slice(0, 220).trim();
      if (!summary.endsWith(".")) summary += ".";
    }
  }

  const dynamicDossier: CompanyDossier = {
    companyName: companyNameFromDomain,
    domain: cleanDomain,
    oneSentenceSummary: summary,
    tagline: tagline,
    targetAudience: "B2B professionals, enterprise organizations, and technology teams.",
    estimatedBusinessModel: "Subscription SaaS & Usage-Based Tiering",
    estimatedHeadcount: "50-250 employees",
    industryTags: ["Technology", "B2B SaaS", "Digital Infrastructure", "Cloud Services"],
    valuePropositions: [
      `Streamlined operations and accelerated time-to-value for ${companyNameFromDomain} customers`,
      "Integrated software platform built for security, scalability, and performance",
      "Modern API-first architecture enabling rapid integration into enterprise stacks",
      "Dedicated customer support and enterprise onboarding SLAs",
    ],
    techTags: ["React", "TypeScript", "Next.js", "Node.js", "AWS", "REST APIs", "Tailwind CSS"],
    top3PainPoints: [
      `Scaling inbound pipeline conversion while preserving high-touch onboarding for ${companyNameFromDomain}'s key accounts.`,
      "Automating cross-tool data synchronization between customer-facing apps and backend reporting pipelines.",
      "Increasing self-serve product activation rates for non-technical buyer personas.",
    ],
    keyFeatures: [
      "Core Platform API",
      "Automated Workflows",
      "Analytics & Reporting Dashboard",
      "Enterprise Security & Access Controls",
      "Third-Party Ecosystem Integrations",
    ],
  };

  const dynamicEmails: OutreachEmail[] = [
    {
      type: "cold_open",
      label: "Initial Outreach",
      subject: `Accelerating ${companyNameFromDomain}'s customer onboarding pipeline`,
      body: `Hi [Name],

I've been following ${companyNameFromDomain}'s growth across ${cleanDomain} — great work on your recent product enhancements.

Typically, companies at your scale encounter a common bottleneck: scaling new customer onboarding without multiplying manual customer success overhead.

We've developed a workflow automation engine that cuts enterprise setup friction by 45% while keeping your existing tech stack intact.

Would you have 10 minutes next Tuesday to explore whether this could move the needle for ${companyNameFromDomain}?

Best regards,
[Your Name]`,
    },
    {
      type: "value_add",
      label: "Strategic Angle",
      subject: `3 growth levers we observed in ${companyNameFromDomain}'s market segment`,
      body: `Hi [Name],

Following up on my previous message. Across teams similar to ${companyNameFromDomain}, we've tracked three recurring friction points:

1. Data reconciliation latency between CRM platforms and operational databases.
2. Slower self-serve adoption when enterprise users hit permission configuration hurdles.
3. Churn risk during the critical 14-day post-signup onboarding window.

We recently published a benchmark breakdown on how peer companies overcome these exact challenges. Happy to share a quick copy if valuable.

Best,
[Your Name]`,
    },
    {
      type: "linkedin_inmail",
      label: "LinkedIn InMail",
      subject: `Growth & onboarding velocity for ${companyNameFromDomain}`,
      body: `Hey [Name], impressed by what you and the team are building at ${companyNameFromDomain}. Quick question: is reducing customer onboarding friction a priority for your team this quarter? We've helped similar teams streamline this with zero engineering overhead. Open to a brief chat?`,
    },
    {
      type: "follow_up",
      label: "Closing Touch",
      subject: `Re: Growth velocity for ${companyNameFromDomain}`,
      body: `Hi [Name], understand your priorities are full. If onboarding acceleration touches your roadmap down the line, feel free to pull this thread back up.

Wishing you and the ${companyNameFromDomain} team continued momentum!

Best,
[Your Name]`,
    },
  ];

  return {
    dossier: dynamicDossier,
    emails: dynamicEmails,
    rawContent: scrapedContent,
    timestamp: new Date().toISOString(),
  };
}
