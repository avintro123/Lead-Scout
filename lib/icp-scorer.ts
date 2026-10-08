import {
  CompanyDossier,
  IcpCriterionBreakdown,
  IcpScoreResult,
  IcpTier,
} from "./types";
import { UserSettings, DEFAULT_SETTINGS } from "./storage";

/**
 * LeadScout Deterministic ICP Scoring Engine
 * Evaluates target accounts on a 0 - 100 scale across 4 core dimensions (25 pts each):
 * 1. Headcount & Scale (25 pts)
 * 2. Business Model & Revenue Engine (25 pts)
 * 3. Tech Stack & Digital Maturity (25 pts)
 * 4. Operational Pain Point & Sales Urgency (25 pts)
 */
export function calculateIcpScore(
  dossier: CompanyDossier,
  settings?: UserSettings
): IcpScoreResult {
  const icp = settings?.icpProfile || DEFAULT_SETTINGS.icpProfile!;

  // -------------------------------------------------------------
  // 1. Headcount & Account Scale (25 pts max)
  // -------------------------------------------------------------
  const headcountStr = dossier.estimatedHeadcount || "";
  let headcountScore = 12;
  const headcountSignals: string[] = [];
  let headcountReason = "";

  // Parse numbers from headcount
  const cleanHeadcount = headcountStr.toLowerCase().replace(/,/g, "");
  const numMatches = cleanHeadcount.match(/\d+/g);
  const maxDetected = numMatches
    ? Math.max(...numMatches.map((n) => parseInt(n, 10)))
    : 0;

  if (maxDetected >= 5000 || cleanHeadcount.includes("8,000") || cleanHeadcount.includes("10,000") || cleanHeadcount.includes("5,000+")) {
    headcountScore = 25;
    headcountSignals.push("Enterprise Scale (5,000+ FTEs)", "Multi-Department Buying Centers");
    headcountReason = "Enterprise-tier organization with significant budget and multiple buying committees.";
  } else if (maxDetected >= 1000) {
    headcountScore = 23;
    headcountSignals.push("Upper Mid-Market (1,000 - 5,000 FTEs)", "High Annual Contract Value (ACV)");
    headcountReason = "Upper mid-market account with dedicated procurement processes and scaling teams.";
  } else if (maxDetected >= 250) {
    headcountScore = 20;
    headcountSignals.push("Mid-Market Scale (250 - 1,000 FTEs)", "Rapid Growth Trajectory");
    headcountReason = "Mid-market scaleup undergoing operational expansion; ideal velocity target.";
  } else if (maxDetected >= 50) {
    headcountScore = 16;
    headcountSignals.push("Growth Stage (50 - 250 FTEs)");
    headcountReason = "Early growth account; fast decision cycles but potentially more constrained budgets.";
  } else {
    headcountScore = 11;
    headcountSignals.push("Early Stage / Boutique (<50 FTEs)");
    headcountReason = "Early-stage footprint. Shorter sales cycle, but lower average contract value.";
  }

  // Check custom ICP headcount criteria
  if (icp.targetHeadcounts && icp.targetHeadcounts.length > 0) {
    const matchesTarget = icp.targetHeadcounts.some((target) => {
      if (target.includes("5,000+") && maxDetected >= 5000) return true;
      if (target.includes("1,000") && maxDetected >= 1000) return true;
      if (target.includes("250") && maxDetected >= 250) return true;
      return false;
    });
    if (matchesTarget && !headcountSignals.includes("Matches ICP Headcount Preference")) {
      headcountSignals.push("Matches User ICP Preference");
    }
  }

  const headcountBreakdown: IcpCriterionBreakdown = {
    id: "headcount",
    title: "Account Scale & Headcount",
    category: "Firmographics",
    score: headcountScore,
    maxScore: 25,
    percentage: Math.round((headcountScore / 25) * 100),
    status:
      headcountScore >= 22
        ? "excellent"
        : headcountScore >= 18
        ? "good"
        : headcountScore >= 14
        ? "fair"
        : "poor",
    reason: headcountReason,
    matchedSignals: headcountSignals,
  };

  // -------------------------------------------------------------
  // 2. Business Model & Revenue Engine (25 pts max)
  // -------------------------------------------------------------
  const modelStr = (dossier.estimatedBusinessModel || "").toLowerCase();
  const industryStr = (dossier.industryTags || []).join(" ").toLowerCase();
  const summaryStr = (dossier.oneSentenceSummary || "").toLowerCase();
  const combinedModelText = `${modelStr} ${industryStr} ${summaryStr}`;

  let modelScore = 14;
  const modelSignals: string[] = [];

  const isB2BSaaS =
    combinedModelText.includes("saas") ||
    combinedModelText.includes("subscription") ||
    combinedModelText.includes("recurring") ||
    combinedModelText.includes("software as a service");

  const isUsageOrEnterprise =
    combinedModelText.includes("usage-based") ||
    combinedModelText.includes("transaction") ||
    combinedModelText.includes("enterprise") ||
    combinedModelText.includes("infrastructure") ||
    combinedModelText.includes("developer") ||
    combinedModelText.includes("api");

  const isFintechOrPlatform =
    combinedModelText.includes("fintech") ||
    combinedModelText.includes("payments") ||
    combinedModelText.includes("platform") ||
    combinedModelText.includes("marketplace");

  if (isB2BSaaS && isUsageOrEnterprise) {
    modelScore = 25;
    modelSignals.push("B2B SaaS / Infrastructure", "Enterprise Recurring / Usage Pricing", "High Net Retention");
  } else if (isB2BSaaS) {
    modelScore = 22;
    modelSignals.push("B2B SaaS Subscription", "Predictable Recurring Revenue");
  } else if (isUsageOrEnterprise || isFintechOrPlatform) {
    modelScore = 21;
    modelSignals.push("Enterprise Platform / Transactional", "High Volume Infrastructure");
  } else if (combinedModelText.includes("b2b")) {
    modelScore = 18;
    modelSignals.push("Standard B2B Commercial Model");
  } else {
    modelScore = 12;
    modelSignals.push("Divergent Business Model");
  }

  // Check custom user target models
  if (icp.targetBusinessModels?.length) {
    const customMatches = icp.targetBusinessModels.filter((m) =>
      combinedModelText.includes(m.toLowerCase())
    );
    if (customMatches.length > 0) {
      modelSignals.push(`Matches ICP Model: ${customMatches.slice(0, 2).join(", ")}`);
      modelScore = Math.min(25, modelScore + 2);
    }
  }

  const modelReason =
    modelScore >= 22
      ? "Strong B2B SaaS recurring / infrastructure model with high expansion potential and predictable procurement."
      : modelScore >= 18
      ? "Solid B2B revenue framework aligned with standard enterprise procurement patterns."
      : "Business model displays moderate deviation from standard recurring software accounts.";

  const modelBreakdown: IcpCriterionBreakdown = {
    id: "business_model",
    title: "Business Model & Monetization",
    category: "Economics",
    score: modelScore,
    maxScore: 25,
    percentage: Math.round((modelScore / 25) * 100),
    status:
      modelScore >= 22
        ? "excellent"
        : modelScore >= 18
        ? "good"
        : modelScore >= 14
        ? "fair"
        : "poor",
    reason: modelReason,
    matchedSignals: modelSignals,
  };

  // -------------------------------------------------------------
  // 3. Tech Stack & Digital Architecture (25 pts max)
  // -------------------------------------------------------------
  const techTags = dossier.techTags || [];
  let techScore = 12;
  const techSignals: string[] = [];

  const modernKeywords = [
    "api",
    "cloud",
    "webhook",
    "platform",
    "security",
    "billing",
    "stripe",
    "postgresql",
    "react",
    "next.js",
    "aws",
    "docker",
    "ai",
    "connect",
    "analytics",
  ];

  const matchedTechKeywords = techTags.filter((t) =>
    modernKeywords.some((k) => t.toLowerCase().includes(k))
  );

  if (techTags.length >= 6 || matchedTechKeywords.length >= 4) {
    techScore = 25;
    techSignals.push(`${techTags.length} Detected Technologies`, "API-First Architecture", "Cloud Native");
  } else if (techTags.length >= 4 || matchedTechKeywords.length >= 2) {
    techScore = 21;
    techSignals.push(`${techTags.length} Detected Technologies`, "Modern Stack Components");
  } else if (techTags.length >= 2) {
    techScore = 16;
    techSignals.push("Foundational Tech Stack Detected");
  } else {
    techScore = 11;
    techSignals.push("Minimal Public Tech Telemetry");
  }

  // Check custom ICP keywords
  if (icp.targetKeywords?.length) {
    const customTechMatches = icp.targetKeywords.filter((kw) =>
      techTags.some((t) => t.toLowerCase().includes(kw.toLowerCase()))
    );
    if (customTechMatches.length > 0) {
      techSignals.push(`Target Keyword Hits: ${customTechMatches.slice(0, 3).join(", ")}`);
      techScore = Math.min(25, techScore + 2);
    }
  }

  const techReason =
    techScore >= 22
      ? "Advanced, composable technology stack with high API readiness and engineering sophistication."
      : techScore >= 17
      ? "Demonstrates modern tech adoption with solid integration touchpoints."
      : "Limited detected tech stack; may require standard legacy integration motions.";

  const techBreakdown: IcpCriterionBreakdown = {
    id: "tech_stack",
    title: "Tech Stack & Architecture",
    category: "Technical Telemetry",
    score: techScore,
    maxScore: 25,
    percentage: Math.round((techScore / 25) * 100),
    status:
      techScore >= 22
        ? "excellent"
        : techScore >= 18
        ? "good"
        : techScore >= 14
        ? "fair"
        : "poor",
    reason: techReason,
    matchedSignals: techSignals,
  };

  // -------------------------------------------------------------
  // 4. Operational Pain Point & Sales Urgency (25 pts max)
  // -------------------------------------------------------------
  const painPoints = dossier.top3PainPoints || [];
  const competitors = dossier.competitors || [];
  const battlecard = dossier.battlecardSummary;

  let painScore = 15;
  const painSignals: string[] = [];

  const frictionKeywords = [
    "complexity",
    "friction",
    "scale",
    "latency",
    "manual",
    "compliance",
    "reconciliation",
    "cost",
    "bottleneck",
    "fragmented",
    "overhead",
  ];

  const matchedFriction = painPoints.filter((pp) =>
    frictionKeywords.some((k) => pp.toLowerCase().includes(k))
  );

  if (painPoints.length >= 3 && (matchedFriction.length >= 2 || competitors.length > 0)) {
    painScore = 24;
    painSignals.push("3 Acute Friction Angles Identified", "Active Incumbent Displacement Potential");
  } else if (painPoints.length >= 2) {
    painScore = 20;
    painSignals.push("Multi-Pillar Operational Friction");
  } else if (painPoints.length >= 1) {
    painScore = 16;
    painSignals.push("Initial Pain Signal Captured");
  } else {
    painScore = 12;
    painSignals.push("Generic Pain Signals");
  }

  if (battlecard?.whySwitchSummary) {
    painSignals.push("Clear Switching Catalyst Documented");
    painScore = Math.min(25, painScore + 1);
  }

  const painReason =
    painScore >= 22
      ? "Acute operational pain points detected with proven incumbent alternatives, yielding high outbound reply likelihood."
      : painScore >= 18
      ? "Clear pain angles available for Pain-Agitate-Solution cold messaging."
      : "Pain points are high-level; discovery questions will be required to uncover urgent budget.";

  const painBreakdown: IcpCriterionBreakdown = {
    id: "pain_points",
    title: "Operational Friction & Urgency",
    category: "Sales Motion",
    score: painScore,
    maxScore: 25,
    percentage: Math.round((painScore / 25) * 100),
    status:
      painScore >= 22
        ? "excellent"
        : painScore >= 18
        ? "good"
        : painScore >= 14
        ? "fair"
        : "poor",
    reason: painReason,
    matchedSignals: painSignals,
  };

  // -------------------------------------------------------------
  // Aggregate Score, Tier & Recommended SDR Action
  // -------------------------------------------------------------
  const totalScore = Math.min(
    100,
    Math.max(
      0,
      headcountBreakdown.score +
        modelBreakdown.score +
        techBreakdown.score +
        painBreakdown.score
    )
  );

  let tier: IcpTier = "tier_2";
  let tierLabel = "Tier 2 · Qualified Prospect";
  let priorityLevel: "Critical" | "High" | "Moderate" | "Low" = "High";
  let verdict = "";
  let recommendedAction = "";

  if (totalScore >= 80) {
    tier = "tier_1";
    tierLabel = "Tier 1 · High Priority Target";
    priorityLevel = "Critical";
    verdict =
      "Exceptional ICP alignment. Large enterprise scale, modern API architecture, and acute operational friction make this a top-priority account for custom executive outreach.";
    recommendedAction =
      "Fast-Track to Multi-Touch Outbound. Deploy customized 4-touch PAS sequence to VP/C-Suite with competitive battlecard and objection kill points.";
  } else if (totalScore >= 60) {
    tier = "tier_2";
    tierLabel = "Tier 2 · Qualified Prospect";
    priorityLevel = "High";
    verdict =
      "Strong candidate. Demonstrates solid firmographic and business model alignment with verifiable operational gaps.";
    recommendedAction =
      "Enroll into Standard SDR Cadence. Deploy multi-touch cold email sequence; test Subject Line Variation #2 and lead with Pain Angle #1.";
  } else {
    tier = "tier_3";
    tierLabel = "Tier 3 · Nurture / Low Fit";
    priorityLevel = "Moderate";
    verdict =
      "Sub-optimal alignment with primary enterprise criteria due to smaller headcount, divergent revenue model, or low immediate friction.";
    recommendedAction =
      "Route to Long-Term Nurture. Add to quarterly marketing campaign and monitor for leadership changes or new funding rounds.";
  }

  return {
    totalScore,
    tier,
    tierLabel,
    verdict,
    recommendedAction,
    priorityLevel,
    breakdown: [headcountBreakdown, modelBreakdown, techBreakdown, painBreakdown],
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Visual styling token helper for ICP badges
 */
export function getTierBadgeStyle(tier: IcpTier) {
  switch (tier) {
    case "tier_1":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-800",
        border: "border-emerald-200",
        dot: "bg-emerald-600",
        badge: "bg-emerald-600 text-white",
        ring: "ring-emerald-500/20",
      };
    case "tier_2":
      return {
        bg: "bg-blue-50",
        text: "text-blue-800",
        border: "border-blue-200",
        dot: "bg-blue-600",
        badge: "bg-blue-600 text-white",
        ring: "ring-blue-500/20",
      };
    case "tier_3":
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-500",
        badge: "bg-slate-600 text-white",
        ring: "ring-slate-500/20",
      };
  }
}
