import {
  CompanyDossier,
  DecisionMakerContact,
  Department,
  EmailPatternGuess,
  OutreachEmail,
  SeniorityLevel,
} from "./types";

/**
 * Normalizes name strings for email generation (strips accents, non-alpha, spaces)
 */
function cleanNamePart(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Computes corporate email address given a first name, last name, domain, and pattern.
 */
export function generateCorporateEmail(
  firstName: string,
  lastName: string,
  domain: string,
  pattern: "{first}.{last}@{domain}" | "{first}@{domain}" | "{f}{last}@{domain}" | "{first}{last}@{domain}" = "{first}.{last}@{domain}"
): string {
  const f = cleanNamePart(firstName) || "prospect";
  const l = cleanNamePart(lastName) || "contact";
  const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  switch (pattern) {
    case "{first}.{last}@{domain}":
      return `${f}.${l}@${cleanDomain}`;
    case "{first}@{domain}":
      return `${f}@${cleanDomain}`;
    case "{f}{last}@{domain}":
      return `${f.charAt(0)}${l}@${cleanDomain}`;
    case "{first}{last}@{domain}":
      return `${f}${l}@${cleanDomain}`;
    default:
      return `${f}.${l}@${cleanDomain}`;
  }
}

/**
 * Detects the most probable email naming convention based on company size and market positioning.
 */
export function detectCompanyEmailPattern(
  domain: string,
  headcountStr = "250 - 1,000"
): {
  primaryPattern: "{first}.{last}@{domain}" | "{first}@{domain}" | "{f}{last}@{domain}" | "{first}{last}@{domain}";
  confidence: number;
  patterns: EmailPatternGuess[];
} {
  const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const hcLower = headcountStr.toLowerCase();

  // Micro / Small Startups (<50) typically use first@domain
  const isSmallStartup =
    hcLower.includes("1-10") ||
    hcLower.includes("11-50") ||
    hcLower.includes("seed") ||
    hcLower.includes("early");

  // Enterprise (1,000+) almost universally uses first.last@domain or f.last@domain
  const isEnterprise =
    hcLower.includes("1,000") ||
    hcLower.includes("5,000") ||
    hcLower.includes("8,000") ||
    hcLower.includes("10,000") ||
    hcLower.includes("enterprise");

  if (isSmallStartup) {
    return {
      primaryPattern: "{first}@{domain}",
      confidence: 82,
      patterns: [
        {
          pattern: "{first}@{domain}",
          example: `alex@${cleanDomain}`,
          confidenceScore: 82,
          isLikelyPrimary: true,
          sampleName: "Alex Rivera",
        },
        {
          pattern: "{first}.{last}@{domain}",
          example: `alex.rivera@${cleanDomain}`,
          confidenceScore: 68,
          isLikelyPrimary: false,
          sampleName: "Alex Rivera",
        },
        {
          pattern: "{f}{last}@{domain}",
          example: `arivera@${cleanDomain}`,
          confidenceScore: 40,
          isLikelyPrimary: false,
          sampleName: "Alex Rivera",
        },
      ],
    };
  }

  if (isEnterprise) {
    return {
      primaryPattern: "{first}.{last}@{domain}",
      confidence: 94,
      patterns: [
        {
          pattern: "{first}.{last}@{domain}",
          example: `alex.rivera@${cleanDomain}`,
          confidenceScore: 94,
          isLikelyPrimary: true,
          sampleName: "Alex Rivera",
        },
        {
          pattern: "{f}{last}@{domain}",
          example: `arivera@${cleanDomain}`,
          confidenceScore: 78,
          isLikelyPrimary: false,
          sampleName: "Alex Rivera",
        },
        {
          pattern: "{first}{last}@{domain}",
          example: `alexrivera@${cleanDomain}`,
          confidenceScore: 35,
          isLikelyPrimary: false,
          sampleName: "Alex Rivera",
        },
      ],
    };
  }

  // Default: Mid-market (50 - 1,000)
  return {
    primaryPattern: "{first}.{last}@{domain}",
    confidence: 86,
    patterns: [
      {
        pattern: "{first}.{last}@{domain}",
        example: `alex.rivera@${cleanDomain}`,
        confidenceScore: 86,
        isLikelyPrimary: true,
        sampleName: "Alex Rivera",
      },
      {
        pattern: "{f}{last}@{domain}",
        example: `arivera@${cleanDomain}`,
        confidenceScore: 65,
        isLikelyPrimary: false,
        sampleName: "Alex Rivera",
      },
      {
        pattern: "{first}@{domain}",
        example: `alex@${cleanDomain}`,
        confidenceScore: 52,
        isLikelyPrimary: false,
        sampleName: "Alex Rivera",
      },
    ],
  };
}

/**
 * Curated benchmark decision-maker personas for instant high-fidelity demonstration
 */
const PRESET_DECISION_MAKERS: Record<string, DecisionMakerContact[]> = {
  "stripe.com": [
    {
      id: "dm_stripe_1",
      firstName: "David",
      lastName: "Singleton",
      fullName: "David Singleton",
      title: "Chief Technology Officer",
      department: "Engineering & Tech",
      seniority: "C-Level",
      corporateEmail: "david.singleton@stripe.com",
      emailConfidence: 96,
      patternUsed: "{first}.{last}@stripe.com",
      departmentPainPoint: "Maintaining 99.999% global API reliability while decoupling legacy Ruby services into distributed Go services.",
      talkingAngle: "Zero-downtime microservices orchestration and developer infrastructure velocity.",
      suggestedHook: "Observed Stripe's architectural migration from monolithic Ruby to Go services.",
      linkedinSearchUrl: "https://www.linkedin.com/search/results/people/?keywords=David%20Singleton%20Stripe",
      isVerifiedPattern: true,
    },
    {
      id: "dm_stripe_2",
      firstName: "Eileen",
      lastName: "O'Mara",
      fullName: "Eileen O'Mara",
      title: "Chief Revenue Officer",
      department: "Sales & Revenue",
      seniority: "C-Level",
      corporateEmail: "eileen.omara@stripe.com",
      emailConfidence: 94,
      patternUsed: "{first}.{last}@stripe.com",
      departmentPainPoint: "Compressing enterprise onboarding cycles for Fortune 500 multi-entity accounts needing custom interchange billing.",
      talkingAngle: "Shortening 6-month enterprise procurement cycles and increasing multi-product expansion.",
      suggestedHook: "Scaling enterprise ARR velocity against aggressive challenger pricing.",
      linkedinSearchUrl: "https://www.linkedin.com/search/results/people/?keywords=Eileen%20O'Mara%20Stripe",
      isVerifiedPattern: true,
    },
    {
      id: "dm_stripe_3",
      firstName: "Jeff",
      lastName: "Weinstein",
      fullName: "Jeff Weinstein",
      title: "Product Lead, Stripe Billing & Pricing",
      department: "Product",
      seniority: "Head / Director",
      corporateEmail: "jeff.weinstein@stripe.com",
      emailConfidence: 92,
      patternUsed: "{first}.{last}@stripe.com",
      departmentPainPoint: "Reducing custom code overhead when SaaS customers configure hybrid usage-based + recurring minimum commitments.",
      talkingAngle: "Automating self-serve enterprise pricing tiers without engineering interventions.",
      suggestedHook: "Unifying usage-metering with multi-currency enterprise contracts.",
      linkedinSearchUrl: "https://www.linkedin.com/search/results/people/?keywords=Jeff%20Weinstein%20Stripe",
      isVerifiedPattern: true,
    },
    {
      id: "dm_stripe_4",
      firstName: "Claire",
      lastName: "Hughes Johnson",
      fullName: "Claire Hughes Johnson",
      title: "Corporate Officer & Operational Advisor",
      department: "Executive & Operations",
      seniority: "C-Level",
      corporateEmail: "claire.johnson@stripe.com",
      emailConfidence: 91,
      patternUsed: "{first}.{last}@stripe.com",
      departmentPainPoint: "Operational scaling friction across 8,000+ distributed team members across multiple timezones.",
      talkingAngle: "Executive operating cadences, organizational clarity, and headcount leverage.",
      suggestedHook: "Eliminating cross-functional bottlenecks in scaling global tech operations.",
      linkedinSearchUrl: "https://www.linkedin.com/search/results/people/?keywords=Claire%20Hughes%20Johnson%20Stripe",
      isVerifiedPattern: true,
    },
  ],
  "notion.so": [
    {
      id: "dm_notion_1",
      firstName: "Ivan",
      lastName: "Zhao",
      fullName: "Ivan Zhao",
      title: "Co-Founder & CEO",
      department: "Executive & Operations",
      seniority: "C-Level",
      corporateEmail: "ivan@notion.so",
      emailConfidence: 98,
      patternUsed: "{first}@notion.so",
      departmentPainPoint: "Defending Notion against Microsoft Copilot and native enterprise workspace consolidation.",
      talkingAngle: "Deep AI workspace penetration and high-margin enterprise seat expansion.",
      suggestedHook: "Elevating Notion from team documentation into the central enterprise operating brain.",
      linkedinSearchUrl: "https://www.linkedin.com/search/results/people/?keywords=Ivan%20Zhao%20Notion",
      isVerifiedPattern: true,
    },
    {
      id: "dm_notion_2",
      firstName: "Fuzzy",
      lastName: "Khurana",
      fullName: "Fuzzy Khurana",
      title: "Head of Engineering",
      department: "Engineering & Tech",
      seniority: "VP",
      corporateEmail: "fuzzy@notion.so",
      emailConfidence: 89,
      patternUsed: "{first}@notion.so",
      departmentPainPoint: "Database query latency and real-time multiplayer sync latency on workspaces with >500k blocks.",
      talkingAngle: "Sub-50ms distributed database queries and SQLite offline client caching.",
      suggestedHook: "Ensuring zero lag across collaborative enterprise databases with 500+ active editors.",
      linkedinSearchUrl: "https://www.linkedin.com/search/results/people/?keywords=Head%20of%20Engineering%20Notion",
      isVerifiedPattern: true,
    },
    {
      id: "dm_notion_3",
      firstName: "Erika",
      lastName: "Kawa",
      fullName: "Erika Kawa",
      title: "VP of Enterprise Sales",
      department: "Sales & Revenue",
      seniority: "VP",
      corporateEmail: "erika@notion.so",
      emailConfidence: 88,
      patternUsed: "{first}@notion.so",
      departmentPainPoint: "Converting self-serve bottom-up teams into centralized 6-figure enterprise workspace agreements.",
      talkingAngle: "Automating product-led sales (PLS) account triggers and enterprise security review handoffs.",
      suggestedHook: "Flagging enterprise license consolidation opportunities before bottom-up teams churn.",
      linkedinSearchUrl: "https://www.linkedin.com/search/results/people/?keywords=VP%20Enterprise%20Sales%20Notion",
      isVerifiedPattern: true,
    },
  ],
};

/**
 * Discovers and generates high-probability executive decision-maker personas for any target company.
 */
export function discoverDecisionMakers(dossier: CompanyDossier): DecisionMakerContact[] {
  const cleanDomain = dossier.domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  // 1. Check curated preset benchmark
  if (PRESET_DECISION_MAKERS[cleanDomain]) {
    return PRESET_DECISION_MAKERS[cleanDomain];
  }

  // 2. Existing personas in dossier
  if (dossier.decisionMakers && dossier.decisionMakers.length > 0) {
    return dossier.decisionMakers;
  }

  // 3. Algorithmic Persona Generation based on domain, headcount, industry, and pain points
  const { primaryPattern, confidence } = detectCompanyEmailPattern(cleanDomain, dossier.estimatedHeadcount);

  const pain1 = dossier.top3PainPoints?.[0] || "Scaling sales velocity and reducing sales cycle friction.";
  const pain2 = dossier.top3PainPoints?.[1] || "Engineering infrastructure constraints and technical debt.";
  const pain3 = dossier.top3PainPoints?.[2] || "Enterprise customer onboarding and churn risk.";

  const dynamicPersonas: DecisionMakerContact[] = [
    {
      id: `dm_${cleanDomain.replace(/[^a-z0-9]/g, "_")}_vp_rev`,
      firstName: "Marcus",
      lastName: "Vance",
      fullName: "Marcus Vance",
      title: "VP of Revenue Operations & Sales",
      department: "Sales & Revenue",
      seniority: "VP",
      corporateEmail: generateCorporateEmail("Marcus", "Vance", cleanDomain, primaryPattern),
      emailConfidence: confidence,
      patternUsed: primaryPattern.replace("{domain}", cleanDomain),
      departmentPainPoint: pain1,
      talkingAngle: "Accelerating pipeline velocity and shortening enterprise close cycles.",
      suggestedHook: `Optimizing ${dossier.companyName}'s enterprise sales cycle and pipeline conversion.`,
      linkedinSearchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
        dossier.companyName + " VP Sales OR Chief Revenue Officer"
      )}`,
      isVerifiedPattern: false,
    },
    {
      id: `dm_${cleanDomain.replace(/[^a-z0-9]/g, "_")}_cto`,
      firstName: "Elena",
      lastName: "Rostova",
      fullName: "Elena Rostova",
      title: "VP of Engineering / Chief Technology Officer",
      department: "Engineering & Tech",
      seniority: "C-Level",
      corporateEmail: generateCorporateEmail("Elena", "Rostova", cleanDomain, primaryPattern),
      emailConfidence: confidence - 3,
      patternUsed: primaryPattern.replace("{domain}", cleanDomain),
      departmentPainPoint: pain2,
      talkingAngle: "Reducing infrastructure latency and accelerating sprint delivery velocity.",
      suggestedHook: `Modernizing technical stack and streamlining ${dossier.companyName}'s engineering throughput.`,
      linkedinSearchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
        dossier.companyName + " CTO OR VP Engineering"
      )}`,
      isVerifiedPattern: false,
    },
    {
      id: `dm_${cleanDomain.replace(/[^a-z0-9]/g, "_")}_cpo`,
      firstName: "Julian",
      lastName: "Chen",
      fullName: "Julian Chen",
      title: "Head of Product & Growth",
      department: "Product",
      seniority: "Head / Director",
      corporateEmail: generateCorporateEmail("Julian", "Chen", cleanDomain, primaryPattern),
      emailConfidence: confidence - 5,
      patternUsed: primaryPattern.replace("{domain}", cleanDomain),
      departmentPainPoint: pain3,
      talkingAngle: "Improving 30-day user activation and reducing product churn friction.",
      suggestedHook: `Enhancing ${dossier.companyName}'s onboarding conversion and feature adoption.`,
      linkedinSearchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
        dossier.companyName + " Head of Product OR VP Product"
      )}`,
      isVerifiedPattern: false,
    },
    {
      id: `dm_${cleanDomain.replace(/[^a-z0-9]/g, "_")}_cmo`,
      firstName: "Rachel",
      lastName: "Sterling",
      fullName: "Rachel Sterling",
      title: "VP of Demand Generation & Marketing",
      department: "Marketing & Growth",
      seniority: "VP",
      corporateEmail: generateCorporateEmail("Rachel", "Sterling", cleanDomain, primaryPattern),
      emailConfidence: confidence - 7,
      patternUsed: primaryPattern.replace("{domain}", cleanDomain),
      departmentPainPoint: "Lowering blended CAC while driving qualified enterprise demo requests.",
      talkingAngle: "High-intent account-based marketing (ABM) and pipeline attribution.",
      suggestedHook: `Driving predictable enterprise inbound pipeline for ${dossier.companyName}.`,
      linkedinSearchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
        dossier.companyName + " VP Marketing OR Head of Demand Gen"
      )}`,
      isVerifiedPattern: false,
    },
  ];

  return dynamicPersonas;
}

/**
 * Dynamically re-tailors a 4-touch outreach sequence to address a specific decision-maker persona.
 */
export function adaptSequenceForPersona(
  emails: OutreachEmail[],
  contact: DecisionMakerContact,
  companyName: string
): OutreachEmail[] {
  if (!emails || emails.length === 0) return [];

  const firstName = contact.firstName || "there";
  const title = contact.title || "leadership";
  const deptPain = contact.departmentPainPoint;

  return emails.map((email, idx) => {
    switch (idx) {
      case 0: // Cold Open
        return {
          ...email,
          subject: `${contact.talkingAngle.split(".")[0]} for ${companyName}`,
          body: `Hi ${firstName},

Given your perspective heading ${contact.department.toLowerCase()} as ${title} at ${companyName}, I wanted to reach out directly.

We've been studying how peer teams tackle: ${deptPain}

We've developed a streamlined framework that addresses this exact operational friction without requiring heavy engineering cycles or disrupting your current stack.

Would you be open to a 10-minute introductory call next week to compare notes?

Best regards,
[Your Name]
[Your Title], [Your Company]`,
        };

      case 1: // Value Add / Case Study
        return {
          ...email,
          subject: `How peer ${contact.department} leaders address ${deptPain.slice(0, 45)}...`,
          body: `Hi ${firstName},

Following up on my note regarding ${companyName}'s ${contact.department.toLowerCase()} roadmap.

When leaders in ${title} roles look to solve ${deptPain.toLowerCase()}, the primary roadblock is usually resource allocation and implementation latency.

We recently published an executive brief breaking down how similar B2B teams reduced this bottleneck by 40% in under 30 days.

Happy to send over a 2-page PDF overview if you'd find it valuable for your team.

Best,
[Your Name]`,
        };

      case 2: // LinkedIn InMail
        return {
          ...email,
          subject: `${contact.title} priorities at ${companyName}`,
          body: `Hey ${firstName}, impressive work steering ${contact.department.toLowerCase()} at ${companyName}. Quick question: is ${deptPain.toLowerCase()} currently top of mind for your team this quarter? We've helped similar leaders accelerate this with zero downtime. Would love to share quick insights if you're open to connecting!`,
        };

      case 3: // Follow-up / Soft Breakup
        return {
          ...email,
          subject: `Re: ${companyName} ${contact.department.toLowerCase()} velocity`,
          body: `Hi ${firstName},

I know your schedule as ${title} at ${companyName} is exceptionally demanding right now.

If solving ${deptPain.toLowerCase()} becomes an active priority on your roadmap in Q3/Q4, feel free to pull this thread back up.

Wishing you and the ${companyName} team continued scale and momentum!

Best regards,
[Your Name]`,
        };

      default:
        return email;
    }
  });
}
