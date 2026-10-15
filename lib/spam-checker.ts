// Spam word dictionary based on SpamAssassin & Google Workspace filters
const SPAM_TRIGGERS = [
  "guarantee",
  "guaranteed",
  "100% free",
  "risk-free",
  "urgent",
  "act now",
  "limited time",
  "exclusive deal",
  "winner",
  "no credit card required",
  "miracle",
  "once in a lifetime",
  "make money",
  "as seen on",
  "cash bonus",
];

export interface SpamCheckResult {
  score: number; // 0 (Clean) to 100 (High risk)
  flaggedWords: string[];
  recommendation:
    | "Excellent Deliverability"
    | "Moderate Risk"
    | "High Spam Risk";
}

export function analyzeEmailDeliverability(
  subject: string,
  body: string,
): SpamCheckResult {
  const fullText = `${subject} ${body}`.toLowerCase();
  const flagged: string[] = [];
  SPAM_TRIGGERS.forEach((word) => {
    if (fullText.includes(word)) {
      flagged.push(word);
    }
  });

  // Calculate score: Each spam word adds 25 points
  const rawScore = Math.min(100, flagged.length * 25);

  let recommendation: SpamCheckResult["recommendation"] =
    "Excellent Deliverability";
  if (rawScore >= 50) {
    recommendation = "High Spam Risk";
  } else if (rawScore > 0) {
    recommendation = "Moderate Risk";
  }

  return {
    score: rawScore,
    flaggedWords: flagged,
    recommendation,
  };
}
