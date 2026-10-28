import {
  CompanyDossier,
  SalesPlaybook,
  ObjectionRebuttal,
  DiscoveryQuestion,
  CompetitorTrap,
  ColdCallHook,
  CompetitorItem,
} from "./types";

/**
 * Intelligent Sales Playbook & Objection Handling Generator
 * Dynamically builds MEDDIC/SPIN discovery scripts, 3-step objection rebuttals,
 * competitor landmine traps, and cold call hooks tailored to any prospect dossier.
 */
export function generateSalesPlaybook(
  dossier: CompanyDossier,
  senderName: string = "Alex Rivera",
  senderCompany: string = "LeadScout"
): SalesPlaybook {
  const company = dossier.companyName || dossier.domain || "Target Prospect";
  const primaryPain =
    dossier.top3PainPoints?.[0] ||
    "scaling operational throughput and reducing developer latency";
  const secondaryPain =
    dossier.top3PainPoints?.[1] ||
    "navigating high operational overhead and legacy workflow friction";
  const tertiaryPain =
    dossier.top3PainPoints?.[2] ||
    "cross-functional coordination bottlenecks across distributed teams";

  const primaryValue =
    dossier.valuePropositions?.[0] ||
    "reducing operational cycle time and accelerating revenue velocity";
  const secondaryValue =
    dossier.valuePropositions?.[1] ||
    "streamlining mission-critical workflows with zero infrastructure bloat";

  const industry = dossier.industryTags?.[0] || "B2B SaaS & Enterprise";
  const primaryCompetitor =
    dossier.competitors?.[0]?.name || "incumbent enterprise vendors";
  const primaryCompetitorDomain =
    dossier.competitors?.[0]?.domain || "competitor.com";

  const topTech = dossier.techTags?.slice(0, 3).join(", ") || "modern cloud stack";

  // 1. Top 6 Objection Rebuttals (Acknowledge -> Reframe -> Pivot)
  const topObjections: ObjectionRebuttal[] = [
    {
      id: "obj_budget",
      objection: "We don't have budget for this right now / Not a spending priority.",
      category: "budget",
      categoryLabel: "Budget & Capital",
      psychologicalRoot:
        "The prospect is risk-averse or guarding discretionary spend against unproven ROI. They assume your solution is an additive line-item expense rather than an immediate cost-saving consolidation.",
      voiceScript: `I completely respect that, and frankly, almost every ${industry} leader we speak with has frozen discretionary software additions this quarter. But the reason we reached out specifically to ${company} is that teams in your space typically leak between 15% to 25% of their team's productive hours dealing with ${primaryPain}—which actually ends up costing significantly more in hidden operational drag. I'm not asking for a dollar of budget today. Would you be open to an 8-minute peer benchmark on how similar teams eliminated that drag without net-new software spend?`,
      steps: {
        acknowledge:
          `"Completely respect that—almost every ${industry} leader has guarded discretionary software additions this quarter."`,
        reframe:
          `"The reason we reached out is that teams dealing with ${primaryPain} lose significant bandwidth, which is a hidden ongoing capital drain."`,
        pivot:
          `"I'm not asking for budget or a PO today. Would you be open to a brief 8-minute peer benchmark on how peers solve this with zero net-new budget?"`,
      },
      trapQuestion:
        `"If you could eliminate ${primaryPain} while remaining revenue-neutral or cash-flow positive, would you still keep it off the roadmap?"`,
      quickTip:
        "Never argue about price. Move the conversation from 'software cost' to 'cost of inaction'.",
    },
    {
      id: "obj_competitor",
      objection: `We already use ${primaryCompetitor} and we're pretty satisfied with what we have.`,
      category: "competitor",
      categoryLabel: "Competitor Lock-in",
      psychologicalRoot:
        "Status quo bias and fear of painful migration. The prospect fears a prolonged rollout or disruption to existing systems.",
      voiceScript: `${primaryCompetitor} is a solid platform, and we would never suggest ripping and replacing an infrastructure that's already serving your base baseline. Where teams like ${company} usually hit a wall with ${primaryCompetitor} is specifically around ${secondaryPain}, where their architecture requires manual workarounds or expensive professional services. In fact, most of our customers actually kept ${primaryCompetitor} in place initially and plugged us in to handle the high-friction edge cases. How is your team currently bridging the gap around ${secondaryPain}?`,
      steps: {
        acknowledge:
          `"${primaryCompetitor} is an established platform, and we would never suggest ripping out a system that's serving your core needs."`,
        reframe:
          `"Where teams like ${company} hit friction with ${primaryCompetitor} is specifically around ${secondaryPain}, where their legacy architecture forces custom workarounds."`,
        pivot:
          `"Most peers run us alongside ${primaryCompetitor} to handle ${primaryValue}. How is your team handling that edge-case friction today?"`,
      },
      trapQuestion:
        `"On a scale of 1 to 10, how well does ${primaryCompetitor} handle ${secondaryPain} without custom internal scripting?"`,
      quickTip:
        "Validate the competitor's strengths first. Disarm them, then expose the exact architectural blindspot.",
    },
    {
      id: "obj_inhouse",
      objection: `We're building / solving this in-house with our own internal engineering team.`,
      category: "inhouse",
      categoryLabel: "In-House Bias",
      psychologicalRoot:
        "Engineering pride or belief that their proprietary requirements are unique. They underestimate ongoing maintenance, technical debt, and compliance overhead.",
      voiceScript: `Given ${company}'s engineering caliber and tech stack (${topTech}), your engineering team could undeniably build this. The real friction our clients experienced wasn't building V1—it was the ongoing maintenance overhead 9 months in when edge cases, security audits, and continuous updates pulled their top engineers away from core product differentiation. Would it hurt to look at the architectural benchmark and edge-case catalog we've already solved over thousands of production hours before locking in engineering sprint cycles?`,
      steps: {
        acknowledge:
          `"Given ${company}'s engineering talent and expertise in ${topTech}, your team could 100% build a working V1."`,
        reframe:
          `"The hidden friction isn't initial build time—it's the 15-20 hours/month of edge-case maintenance and support that pulls top engineers away from core roadmap items."`,
        pivot:
          `"Would it be helpful to see the architectural teardown and edge-case catalog we've battle-tested before dedicating internal sprint points?"`,
      },
      trapQuestion:
        `"What is your projected developer maintenance overhead 6 months post-launch once edge cases start surfacing in production?"`,
      quickTip:
        "Never question their technical ability. Frame it as 'opportunity cost of engineering hours vs core product roadmap'.",
    },
    {
      id: "obj_send_info",
      objection: `Just send me an email or a PDF deck and I'll take a look later.`,
      category: "general",
      categoryLabel: "Brush-Off Defense",
      psychologicalRoot:
        "Default reflex to get off the phone or dismiss unsolicited inbound outreach without committing cognitive energy.",
      voiceScript: `I'd be more than happy to send information over, and I know your inbox is already overflowing. We have a 25-page deck and technical whitepapers, but 90% of it is generic fluff that won't apply to ${company}. To make sure I only send what's actually relevant to you, if I put together a 60-second video teardown specifically focused on how ${company} can solve ${primaryPain}, what's the best email to send it to—and what's one metric you'd need to see in it to make it worth a 5-minute review?`,
      steps: {
        acknowledge:
          `"Happy to send it right over, and I completely respect that your inbox is already packed."`,
        reframe:
          `"We have a 25-page technical deck, but 90% of it is generic overview that won't apply to ${company}'s specific setup."`,
        pivot:
          `"If I send a 60-second customized teardown addressing ${primaryPain}, what is the single metric that matters most to you right now?"`,
      },
      trapQuestion:
        `"So I don't send you generic marketing collateral, what is the single biggest operational metric your team is measured on this quarter?"`,
      quickTip:
        "Agree enthusiastically, qualify the content, and get agreement on what proof point earns a response.",
    },
    {
      id: "obj_timing",
      objection: `It's not a priority this quarter / Our roadmap is already locked.`,
      category: "timing",
      categoryLabel: "Timing & Roadmaps",
      psychologicalRoot:
        "The prospect views the current quarter as packed and assumes evaluation requires heavy operational bandwidth right now.",
      voiceScript: `Understood—timing is everything, and the last thing we want to do is distract your team mid-quarter. The reason companies in your space typically plant the seed 60 days before their next planning cycle is that evaluating how to resolve ${primaryPain} takes a few weeks of architectural alignment. If we wait until next quarter's kickoff, teams usually end up living with ${secondaryPain} for another full quarter. Could we do a 10-minute briefing now so you have the numbers in your back pocket when the next roadmap opens?`,
      steps: {
        acknowledge:
          `"Understood—timing is everything, and we definitely don't want to disrupt active roadmap execution."`,
        reframe:
          `"The reason peers align on this 60 days early is that resolving ${primaryPain} takes a brief architectural review; waiting until kickoff usually means living with the friction for another 3 months."`,
        pivot:
          `"Could we do a low-pressure 10-minute briefing now so you have the peer benchmarks ready when next quarter's roadmap opens?"`,
      },
      trapQuestion:
        `"When you look at next quarter's roadmap, is ${primaryPain} on track to be solved, or will it carry over again?"`,
      quickTip:
        "Don't push for today. Plant the seed for next quarter so you become the pre-selected vendor when budget unlocks.",
    },
    {
      id: "obj_contract",
      objection: `We're locked into an annual contract until next year.`,
      category: "authority",
      categoryLabel: "Contract Lock-In",
      psychologicalRoot:
        "They feel contractually trapped and want to avoid early termination penalties or administrative headaches.",
      voiceScript: `Totally understand—breaking active enterprise contracts rarely makes financial sense. But nearly half of the ${industry} teams we onboard were also 6 to 9 months out from their renewal when we first spoke. We used that runway to conduct a low-risk architectural sandbox, so when their renewal window arrived, they had full validation and leverage to renegotiate or migrate smoothly. When does your current renewal evaluation window officially open?`,
      steps: {
        acknowledge:
          `"Completely understand—breaking active agreements mid-term rarely makes financial sense."`,
        reframe:
          `"Most teams we work with also had 6-9 months remaining; we used that runway for a low-risk sandbox so they held total leverage during renewal negotiations."`,
        pivot:
          `"When does your renewal review window open? Let's benchmark your current rate card and SLAs so you have hard data."`,
      },
      trapQuestion:
        `"Do you have early buyout credits or price-escalation clauses in that contract that you'll want to push back on?"`,
      quickTip:
        "Position yourself as the renewal leverage partner. You help them negotiate better terms or prepare a seamless switch.",
    },
  ];

  // 2. Discovery Questions: SPIN Framework
  const spinQuestions: DiscoveryQuestion[] = [
    {
      id: "spin_s1",
      framework: "SPIN",
      stage: "Situation",
      stageDescription: "Uncover current operational workflows and technical stack context",
      question: `How is ${company} currently orchestrating ${primaryValue} across your team of ${dossier.estimatedHeadcount || "your current team"}?`,
      rationale: "Establishes baseline process without provoking defensiveness.",
      listenFor: {
        greenFlags: [
          "Mentions manual spreadsheets, custom scripts, or disjointed tools",
          "Acknowledges that multiple departments have to touch the process",
        ],
        redFlags: [
          "States they have a fully automated, dedicated in-house infrastructure with 0 issues",
        ],
      },
      targetPersona: "VP / Head of Department",
    },
    {
      id: "spin_s2",
      framework: "SPIN",
      stage: "Situation",
      stageDescription: "Inspect tooling architecture and ecosystem dependencies",
      question: `Looking at your stack around ${topTech}, how tightly integrated are your data pipelines with ${primaryCompetitor || "your third-party vendors"}?`,
      rationale: "Identifies technical stack rigidity or integration bottlenecks.",
      listenFor: {
        greenFlags: [
          "Points out API rate limits, sync delays, or webhook failures",
          "Mentions that engineering has to periodically fix broken connectors",
        ],
        redFlags: [
          "Out-of-the-box turnkey sync with zero maintenance required",
        ],
      },
      targetPersona: "Engineering / Technical Lead",
    },
    {
      id: "spin_p1",
      framework: "SPIN",
      stage: "Problem",
      stageDescription: "Probe for latent dissatisfaction and acute friction points",
      question: `When your team is dealing with ${primaryPain}, where is the biggest friction or bottleneck showing up on a day-to-day basis?`,
      rationale: "Gets the prospect to articulate the pain point in their own words.",
      listenFor: {
        greenFlags: [
          "Emotional validation of frustration, lost time, or team burnout",
          "Specific examples of deals delayed or customer escalations",
        ],
        redFlags: [
          "Claims it's a minor nuisance that rarely impacts operations",
        ],
      },
      targetPersona: "Director / Team Manager",
    },
    {
      id: "spin_p2",
      framework: "SPIN",
      stage: "Problem",
      stageDescription: "Uncover gaps in the current solution",
      question: `What have you and the team tried in the past to resolve ${secondaryPain}, and why did it fall short of expectations?`,
      rationale: "Reveals failed past attempts and criteria for what they distrust.",
      listenFor: {
        greenFlags: [
          "Explains that previous tools were too rigid, expensive, or complex to adopt",
          "Highlights that engineering didn't have bandwidth to support it",
        ],
        redFlags: [
          "Never felt the need to evaluate any solution",
        ],
      },
      targetPersona: "Product / Operations Lead",
    },
    {
      id: "spin_i1",
      framework: "SPIN",
      stage: "Implication",
      stageDescription: "Magnify the cost of inaction and organizational fallout",
      question: `If ${primaryPain} remains unaddressed over the next two quarters, how does that impact your revenue velocity and team bandwidth?`,
      rationale: "Forces the prospect to calculate the compound cost of doing nothing.",
      listenFor: {
        greenFlags: [
          "Prospect acknowledges lost revenue, missed SLAs, or hiring requirements",
          "Recognizes competitive risk against peer market leaders",
        ],
        redFlags: [
          "Believes there are zero downstream financial consequences",
        ],
      },
      targetPersona: "Executive / VP / Economic Buyer",
    },
    {
      id: "spin_i2",
      framework: "SPIN",
      stage: "Implication",
      stageDescription: "Surface executive visibility and team morale risks",
      question: `How much developer or team lead time is spent firefighting ${secondaryPain} instead of accelerating core product roadmap deliverables?`,
      rationale: "Quantifies engineering opportunity cost in hours and dollars.",
      listenFor: {
        greenFlags: [
          "Mentions hours per sprint lost to non-core maintenance",
          "Frustration over missed sprint commitments",
        ],
        redFlags: [
          "Negligible time commitment",
        ],
      },
      targetPersona: "VP of Engineering / CTO",
    },
    {
      id: "spin_n1",
      framework: "SPIN",
      stage: "Need-Payoff",
      stageDescription: "Lead the prospect to visualize the value of solving the pain",
      question: `If your team could automate ${primaryValue} and eliminate ${primaryPain} completely, what would that unlock for ${company}'s targets this year?`,
      rationale: "Allows the prospect to sell themselves on the future state.",
      listenFor: {
        greenFlags: [
          "Excitement about deploying engineering toward new revenue features",
          "Clear articulation of faster customer onboarding or cost savings",
        ],
        redFlags: [
          "Inability to articulate what they would do with freed-up capacity",
        ],
      },
      targetPersona: "Executive / Champion",
    },
    {
      id: "spin_n2",
      framework: "SPIN",
      stage: "Need-Payoff",
      stageDescription: "Confirm criteria for an ideal technical resolution",
      question: `What would an ideal solution look like for ${company}—does it need to be fully API-driven, or turnkey with zero engineering intervention?`,
      rationale: "Pins down their architectural requirements and buying criteria.",
      listenFor: {
        greenFlags: [
          "Clear preference for fast SDK integration, high reliability, and clean documentation",
        ],
        redFlags: [
          "Vague responses with no clear technical requirements",
        ],
      },
      targetPersona: "Technical Evaluator",
    },
  ];

  // 3. Discovery Questions: MEDDIC Framework
  const meddicQuestions: DiscoveryQuestion[] = [
    {
      id: "meddic_m",
      framework: "MEDDIC",
      stage: "Metrics",
      stageDescription: "Quantifiable economic and operational KPIs that measure success",
      question: `What specific KPI or quantifiable target (e.g. reduction in cycle time, CAC savings, or SLA uptime) would you need to see to consider this project a home run?`,
      rationale: "Establishes the exact mathematical formula needed for the business case.",
      listenFor: {
        greenFlags: [
          "Specific numbers: '20% faster turnaround', '$50k monthly savings', 'reducing churn by 2%'",
        ],
        redFlags: [
          "Fluffy goals like 'make things smoother' without measurable benchmarks",
        ],
      },
      targetPersona: "Economic Buyer / VP",
    },
    {
      id: "meddic_eb",
      framework: "MEDDIC",
      stage: "Economic Buyer",
      stageDescription: "Identify the individual with discretionary budget authority",
      question: `Beyond yourself, who ultimately holds the budget sign-off or P&L responsibility for infrastructure improvements at this scale?`,
      rationale: "Prevents pitching someone who cannot execute a commercial contract.",
      listenFor: {
        greenFlags: [
          "Naming the specific C-level or VP: 'Our VP of Tech, Sarah, or CFO approves anything above $25k'",
        ],
        redFlags: [
          "'I decide everything myself' when speaking to a junior contributor",
        ],
      },
      targetPersona: "Champion / Department Head",
    },
    {
      id: "meddic_dc",
      framework: "MEDDIC",
      stage: "Decision Criteria",
      stageDescription: "The technical, security, and commercial hurdles required to win",
      question: `When ${company} evaluates a solution in this category, what are the mandatory technical, security (SOC2/GDPR), and commercial criteria you evaluate?`,
      rationale: "Surfaces hidden trapdoors like Infosec requirements or procurement policies early.",
      listenFor: {
        greenFlags: [
          "Checklist of SOC2 Type II, SSO/SAML, latency under 100ms, and flexible invoicing",
        ],
        redFlags: [
          "No defined criteria, suggesting they are just casually browsing",
        ],
      },
      targetPersona: "Technical Lead / Architect",
    },
    {
      id: "meddic_dp",
      framework: "MEDDIC",
      stage: "Decision Process",
      stageDescription: "The formal evaluation, legal, and procurement path from pilot to PO",
      question: `Walk me through the stages a proposal goes through at ${company} once technical validation passes—what does legal, security, and procurement look like?`,
      rationale: "Maps out the deal timeline and prevents last-minute quarter-end stalls.",
      listenFor: {
        greenFlags: [
          "Specific timeline: '2-week sandbox, then 10 days for legal MSA, then procurement PO'",
        ],
        redFlags: [
          "'We just buy it on a credit card' for a six-figure enterprise proposal",
        ],
      },
      targetPersona: "Champion / Project Owner",
    },
    {
      id: "meddic_ip",
      framework: "MEDDIC",
      stage: "Identify Pain",
      stageDescription: "The acute, compelling reason to act now rather than postpone",
      question: `What is the single most urgent operational bottleneck around ${primaryPain} that is causing the biggest headache for leadership this month?`,
      rationale: "Finds the high-heat problem that gets deals funded in tight budgets.",
      listenFor: {
        greenFlags: [
          "Direct linkage to high-level strategic company objectives or executive mandates",
        ],
        redFlags: [
          "A nice-to-have optimization with no immediate urgency",
        ],
      },
      targetPersona: "All Personas",
    },
    {
      id: "meddic_c",
      framework: "MEDDIC",
      stage: "Champion",
      stageDescription: "Cultivate an internal advocate with power and vested interest",
      question: `Who on the team feels the day-to-day pain of this most acutely and has the internal credibility to champion an evaluation to the executive committee?`,
      rationale: "Identifies whether your contact will fight for you internally when you're not in the room.",
      listenFor: {
        greenFlags: [
          "Contact expresses strong personal motivation to fix this to achieve their career goals",
        ],
        redFlags: [
          "Passive contact who refuses to introduce you to other stakeholders",
        ],
      },
      targetPersona: "Champion",
    },
  ];

  // 4. Competitor Traps & Landmines
  const competitorTraps: CompetitorTrap[] = (
    dossier.competitors && dossier.competitors.length > 0
      ? dossier.competitors
      : [
          {
            name: "Legacy Enterprise Suite",
            domain: "legacyvendor.com",
            category: "Incumbent Platform",
            marketPosition: "Traditional monolith with broad feature coverage but slow innovation.",
            whereTargetWins: [primaryValue, "Modern developer ergonomics"],
            whereCompetitorWins: ["Legacy brand inertia", "Bundled suites"],
            pricingModel: "Enterprise Annual Contract",
            objectionScript: {
              objection: "We are already using an enterprise platform for this.",
              response: "Most platforms are great for broad coverage, but stumble on specialized throughput.",
              killPoint: "High custom maintenance overhead and slow iteration velocity.",
            },
          } as CompetitorItem,
        ]
  ).map((comp) => {
    return {
      competitorName: comp.name,
      competitorDomain: comp.domain,
      landmineQuestion: `When you need to adjust or extend custom workflows in ${comp.name}, how long does it typically take from specification to live deployment in production?`,
      killPoint:
        comp.objectionScript?.killPoint ||
        `High developer friction and rigid customization constraints compared to ${company}'s velocity expectations.`,
      wedgeAngle:
        comp.whereTargetWins?.[0] ||
        `Delivering ${primaryValue} in days without touching existing legacy codebases.`,
      whereTheyFail:
        comp.whereCompetitorWins?.[0]
          ? `While ${comp.name} leads in ${comp.whereCompetitorWins[0]}, they struggle with agile customization and lightweight execution.`
          : `Rigid monolithic architecture that slows down engineering velocity.`,
    };
  });

  // 5. Cold Call Hooks & 30-Second Elevator Pitches
  const coldCallHooks: ColdCallHook[] = [
    {
      personaRole: "CEO / Founder / Executive",
      patternInterrupt:
        `"Hey [Name], I know you weren't expecting my call and you're running between meetings—I promise to be out of your hair in 25 seconds if this isn't relevant."`,
      hookScript:
        `The reason for the call is that we noticed ${company} is scaling rapidly in ${industry}. Most founders we work with found that ${primaryPain} was secretly siphoning off 15% of their team's execution velocity.`,
      elevatorPitch:
        `We help high-growth leaders at companies like ${company} achieve ${primaryValue} without adding headcount or engineering sprint debt.`,
      softAsk:
        `"Would you be completely opposed to a 6-minute peer benchmark on how similar companies streamlined this, or does that sound off base?"`,
    },
    {
      personaRole: "VP / Head of Engineering & Tech",
      patternInterrupt:
        `"Hi [Name], quick call while you're deep in sprint planning—I'll be extremely concise."`,
      hookScript:
        `We've been tracking ${company}'s engineering architecture across ${topTech}. A recurring theme we see with engineering teams at your headcount is that ${primaryPain} burns 10-15 hours per developer every sprint in repetitive maintenance.`,
      elevatorPitch:
        `We provide an ultra-clean, developer-first solution for ${primaryValue} that deploys via clean APIs with zero ongoing maintenance burden.`,
      softAsk:
        `"Have you got 5 minutes next Tuesday to look at the architectural benchmark, or are you satisfied with current sprint velocity?"`,
    },
    {
      personaRole: "VP / Head of Sales & Revenue",
      patternInterrupt:
        `"Hey [Name], sales leader to sales leader—I know you're staring at pipeline targets, so I'll give you the 20-second summary."`,
      hookScript:
        `We work with fast-moving revenue teams in ${industry} where deals get delayed at the 1-yard line because of ${secondaryPain}.`,
      elevatorPitch:
        `We accelerate revenue cycles by turning ${primaryPain} from a deal friction point into an unfair competitive differentiator.`,
      softAsk:
        `"If we could shave 12 days off your average cycle velocity, would it be worth a brief coffee chat next week?"`,
    },
    {
      personaRole: "VP / Head of Product & Operations",
      patternInterrupt:
        `"Hello [Name], I know you're juggling roadmap commitments today—giving you the 30-second context."`,
      hookScript:
        `When surveying customer friction for ${company}, the biggest recurring operational snag is ${tertiaryPain}.`,
      elevatorPitch:
        `We give product leaders a turnkey infrastructure to deliver ${secondaryValue} without pulling engineers off core roadmap epics.`,
      softAsk:
        `"Open to reviewing our 2-page product workflow breakdown async, or should I leave you in peace?"`,
    },
  ];

  const whyWeWinElevatorPitch =
    `Unlike ${primaryCompetitor} and fragmented in-house custom scripts, our approach directly targets ${company}'s acute pain point—${primaryPain}—delivering ${primaryValue} in days rather than quarters, backed by seamless integration into ${topTech}.`;

  const onePagerSummary =
    `# Sales Battlecard & Call Playbook for ${company} (${dossier.domain})
## Core Value Proposition: ${primaryValue}
## Primary Target Pain Point: ${primaryPain}
## Primary Competitor: ${primaryCompetitor}

### Why We Win:
${whyWeWinElevatorPitch}

### Top Landmine Question:
"${competitorTraps[0]?.landmineQuestion || "How are you currently handling custom edge-case workflows?"}"
`;

  return {
    topObjections,
    discoveryQuestions: [...spinQuestions, ...meddicQuestions],
    competitorTraps,
    coldCallHooks,
    whyWeWinElevatorPitch,
    onePagerSummary,
  };
}

/**
 * Generates an executive call cheat sheet in clean Markdown format
 * for reps to print or keep open on a secondary monitor during live calls.
 */
export function generatePlaybookMarkdownCheatSheet(
  playbook: SalesPlaybook,
  dossier: CompanyDossier
): string {
  const date = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `# 🎯 SALES BATTLECARD & CALL CHEAT SHEET: ${dossier.companyName.toUpperCase()}
**Domain:** ${dossier.domain} | **Industry:** ${dossier.industryTags?.join(", ")} | **Scale:** ${dossier.estimatedHeadcount}
**Generated:** ${date} | **Target Pain Point:** ${dossier.top3PainPoints?.[0] || "Operational Scale"}

---

## ⚡ 30-SECOND ELEVATOR PITCH & VALUE PILLARS
> "${playbook.whyWeWinElevatorPitch}"

**Primary Value:** ${dossier.valuePropositions?.[0] || "Accelerated velocity"}
**Secondary Value:** ${dossier.valuePropositions?.[1] || "Reduced operational friction"}

---

## 🥊 TOP 5 OBJECTION COUNTER-SCRIPTS (VOICE READY)

${playbook.topObjections
  .map(
    (obj, idx) => `### ${idx + 1}. Objection: "${obj.objection}"
**Category:** ${obj.categoryLabel}
**Psychological Root:** ${obj.psychologicalRoot}

**Word-for-Word Voice Script:**
> "${obj.voiceScript}"

**The 3-Step Pivot:**
- **Acknowledge:** ${obj.steps.acknowledge}
- **Reframe:** ${obj.steps.reframe}
- **Pivot:** ${obj.steps.pivot}

**Trap Question to Flip Control:**
> "${obj.trapQuestion}"
`
  )
  .join("\n---\n")}

---

## 🎯 DISCOVERY QUESTIONS: SPIN FRAMEWORK

### 1. Situation (Stack & Context)
${playbook.discoveryQuestions
  .filter((q) => q.framework === "SPIN" && q.stage === "Situation")
  .map((q) => `- **Ask:** "${q.question}"\n  *Listen for:* ${q.listenFor.greenFlags.join("; ")}`)
  .join("\n")}

### 2. Problem (Acute Friction)
${playbook.discoveryQuestions
  .filter((q) => q.framework === "SPIN" && q.stage === "Problem")
  .map((q) => `- **Ask:** "${q.question}"\n  *Listen for:* ${q.listenFor.greenFlags.join("; ")}`)
  .join("\n")}

### 3. Implication (Cost of Inaction)
${playbook.discoveryQuestions
  .filter((q) => q.framework === "SPIN" && q.stage === "Implication")
  .map((q) => `- **Ask:** "${q.question}"\n  *Listen for:* ${q.listenFor.greenFlags.join("; ")}`)
  .join("\n")}

### 4. Need-Payoff (Quantifiable Vision)
${playbook.discoveryQuestions
  .filter((q) => q.framework === "SPIN" && q.stage === "Need-Payoff")
  .map((q) => `- **Ask:** "${q.question}"\n  *Listen for:* ${q.listenFor.greenFlags.join("; ")}`)
  .join("\n")}

---

## 📋 QUALIFICATION: MEDDIC FRAMEWORK

${playbook.discoveryQuestions
  .filter((q) => q.framework === "MEDDIC")
  .map(
    (q) => `### [${q.stage.toUpperCase()}] ${q.stageDescription}
- **Ask:** "${q.question}"
- **Rationale:** ${q.rationale}
- **Target Persona:** ${q.targetPersona}
`
  )
  .join("\n")}

---

## 🛡️ COMPETITOR LANDMINES & TRAPS

${playbook.competitorTraps
  .map(
    (trap) => `### Against ${trap.competitorName}
- **Subtle Landmine Question:** "${trap.landmineQuestion}"
- **Kill Point:** ${trap.killPoint}
- **Where They Fail:** ${trap.whereTheyFail}
- **Your Wedge:** ${trap.wedgeAngle}
`
  )
  .join("\n")}

---
*LeadScout Sales Acceleration Engine — Confidential Sales Intelligence*
`;
}
