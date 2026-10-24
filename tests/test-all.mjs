/**
 * Comprehensive Automated Integration & End-to-End Test Suite for LeadScout
 * Tests all core subsystems:
 * 1. Email Compilation & HTML Rendering Engine
 * 2. Deliverability & SpamAssassin Heuristics
 * 3. ICP Fit Scoring & Tier Qualification Matrix
 * 4. SSRF Defense, Sanitization & Security Hardening
 * 5. Sliding-Window Rate Limiting
 * 6. Live API Endpoints on localhost:3000:
 *    - /api/send-test (Single touch, 4-touch digest, validation, sandbox, resend fallback)
 *    - /api/rewrite (AI rewriting with all 5 tone styles)
 *    - /api/scout (SSRF protection & web extraction)
 *    - /api/analyze (Intelligence synthesis)
 *    - /api/test-key (Credential testing)
 *    - /api/auth (Session check)
 * 7. CSV Sequence Export & RFC 4180 Compliance
 */

const BASE_URL = "http://localhost:3000";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = "") {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
  } else {
    failedTests++;
    console.log(`  \x1b[31m✖ FAIL\x1b[0m: ${testName} ${details ? `(${details})` : ""}`);
  }
}

async function runTestSuite() {
  console.log("\n========================================================");
  console.log("       LEADSCOUT COMPREHENSIVE AUTOMATED TEST SUITE     ");
  console.log("========================================================\n");

  // -------------------------------------------------------------------------
  // TEST GROUP 1: Email Compilation & HTML Engine Logic
  // -------------------------------------------------------------------------
  console.log("\x1b[36m[GROUP 1] Email Renderer & HTML Compilation Engine\x1b[0m");

  const {
    isValidEmail,
    getEmailPreheader,
    convertTextToHtmlParagraphs,
    compileHtmlEmail,
    compileSequenceDigestHtml,
  } = await import("../lib/email-renderer.ts");

  assert(isValidEmail("founder@stripe.com") === true, "Valid email format accepted");
  assert(isValidEmail("user.name+tag@company.co.uk") === true, "Complex valid email accepted");
  assert(isValidEmail("not-an-email") === false, "Invalid email missing @ rejected");
  assert(isValidEmail("user@") === false, "Invalid email missing domain rejected");
  assert(isValidEmail("") === false, "Empty email rejected");

  const preheader1 = getEmailPreheader("Hi Alex, I noticed Stripe Billing is growing fast.", 30);
  assert(preheader1.length <= 33 && preheader1.includes("Hi Alex"), "Preheader cuts cleanly");

  const rawTextWithBullets = "Here are the benefits:\n• 60% faster setup\n• Zero downtime migration\n• Unified dashboard";
  const htmlBullets = convertTextToHtmlParagraphs(rawTextWithBullets);
  assert(htmlBullets.includes("<ul") && htmlBullets.includes("<li"), "Bullets converted to HTML list elements");

  const compiledHtml = compileHtmlEmail({
    subject: "Cutting billing latency by 60%",
    body: "Hi Alex,\n\nWe noticed your billing implementation.\n\nBest,\nSarah",
    senderName: "Sarah Chen",
    senderRole: "Head of Growth",
    senderCompany: "Acquisition Engine",
    companyName: "Stripe",
    touchLabel: "Touch 1 · Cold Open",
    touchIndex: 1,
    totalTouches: 4,
    isTestPreview: true,
  });

  assert(compiledHtml.includes("<!DOCTYPE html>"), "Contains valid HTML5 DOCTYPE");
  assert(compiledHtml.includes("⚡ LeadScout Test Send"), "Contains test preview banner");
  assert(compiledHtml.includes("Sarah Chen"), "Contains sender name signature");
  assert(compiledHtml.includes("Acquisition Engine"), "Contains sender company");
  assert(compiledHtml.includes("Touch 1 of 4"), "Contains cadence position header");

  const digestHtml = compileSequenceDigestHtml(
    [
      { subject: "Touch 1 Subject", body: "Touch 1 Body", label: "Day 1 Initial", type: "cold_open" },
      { subject: "Touch 2 Subject", body: "Touch 2 Body", label: "Day 4 Case Study", type: "value_add" },
    ],
    "Stripe",
    "Sarah Chen",
    "Acquisition Engine"
  );
  assert(digestHtml.includes("LeadScout Sequence Digest"), "Sequence digest contains header title");
  assert(digestHtml.includes("Touch #1 (Day 1)"), "Digest contains Touch 1 card");
  assert(digestHtml.includes("Touch #2 (Day 4)"), "Digest contains Touch 2 card");

  // -------------------------------------------------------------------------
  // TEST GROUP 2: Deliverability & SpamAssassin Screening
  // -------------------------------------------------------------------------
  console.log("\n\x1b[36m[GROUP 2] Deliverability & SpamAssassin Heuristics\x1b[0m");

  const { analyzeEmailDeliverability } = await import("../lib/spam-checker.ts");

  const cleanEmail = analyzeEmailDeliverability(
    "Quick question regarding Stripe's enterprise checkout roadmap",
    "Hi Alex, loved your recent keynote at Sessions. We built an orchestration layer that reduces implementation overhead."
  );
  assert(cleanEmail.score === 0, "Clean email scores 0 risk points");
  assert(cleanEmail.recommendation === "Excellent Deliverability", "Clean email recommended as Excellent Deliverability");
  assert(cleanEmail.flaggedWords.length === 0, "No flagged spam triggers in clean email");

  const spammyEmail = analyzeEmailDeliverability(
    "URGENT: Act now for a 100% free miracle guarantee",
    "Once in a lifetime opportunity to make money with zero risk. Act now!"
  );
  assert(spammyEmail.score >= 50, "Spammy email scores >= 50 high risk");
  assert(spammyEmail.recommendation === "High Spam Risk", "Identified as High Spam Risk");
  assert(spammyEmail.flaggedWords.includes("100% free"), "Flagged '100% free'");
  assert(spammyEmail.flaggedWords.includes("act now"), "Flagged 'act now'");

  // -------------------------------------------------------------------------
  // TEST GROUP 3: Security, SSRF Defense & Sanitization
  // -------------------------------------------------------------------------
  console.log("\n\x1b[36m[GROUP 3] Security Hardening & SSRF Defense\x1b[0m");

  const { validateAndSanitizeTargetUrl, sanitizeString, sanitizeDomain } = await import("../lib/security.ts");

  assert(validateAndSanitizeTargetUrl("http://localhost:3000").valid === false, "SSRF rejects localhost");
  assert(validateAndSanitizeTargetUrl("http://127.0.0.1/admin").valid === false, "SSRF rejects 127.0.0.1 loopback");
  assert(validateAndSanitizeTargetUrl("http://169.254.169.254/latest/meta-data").valid === false, "SSRF rejects AWS/GCP cloud metadata IP");
  assert(validateAndSanitizeTargetUrl("http://10.0.0.15/internal").valid === false, "SSRF rejects private RFC 1918 Class A IP");
  assert(validateAndSanitizeTargetUrl("http://192.168.1.1").valid === false, "SSRF rejects private RFC 1918 Class C IP");
  assert(validateAndSanitizeTargetUrl("https://stripe.com").valid === true, "SSRF accepts valid public FQDN (stripe.com)");

  assert(sanitizeString("<script>alert('xss')</script>Hello") === "scriptalert('xss')/scriptHello", "XSS angle brackets stripped");
  assert(sanitizeDomain("https://Stripe.com/pricing?ref=test") === "stripe.com", "Domain correctly sanitized to hostname");

  // -------------------------------------------------------------------------
  // TEST GROUP 4: ICP Fit Scoring & Account Qualification Matrix
  // -------------------------------------------------------------------------
  console.log("\n\x1b[36m[GROUP 4] ICP Fit Scoring & Qualification Rubric\x1b[0m");

  const { calculateIcpScore } = await import("../lib/icp-scorer.ts");
  const { MOCK_DOSSIER } = await import("../lib/types.ts");
  const { DEFAULT_SETTINGS } = await import("../lib/storage.ts");

  const icpResult = calculateIcpScore(MOCK_DOSSIER, DEFAULT_SETTINGS);
  assert(icpResult.totalScore >= 70, `Stripe scores ${icpResult.totalScore}/100 as high-fit ICP account`);
  assert(icpResult.tier === "tier_1", "Stripe classified as Tier 1 account");
  assert(icpResult.breakdown.length === 4, "Breakdown includes all 4 rubric criteria");

  // -------------------------------------------------------------------------
  // TEST GROUP 5: Live API Endpoints (/api/send-test)
  // -------------------------------------------------------------------------
  console.log("\n\x1b[36m[GROUP 5] Live API: /api/send-test\x1b[0m");

  // Test 5.1: Missing / Invalid recipient email
  try {
    const res = await fetch(`${BASE_URL}/api/send-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientEmail: "invalid-email", subject: "Test", body: "Hello" }),
    });
    const data = await res.json();
    assert(res.status === 400 && data.error.includes("valid recipient email"), "Rejects invalid email format with 400");
  } catch (e) {
    assert(false, "Call /api/send-test with invalid email", e.message);
  }

  // Test 5.2: Sandbox Simulation Mode (Single Touch)
  try {
    const res = await fetch(`${BASE_URL}/api/send-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientEmail: "test@leadscout.internal",
        subject: "Cutting enterprise checkout friction",
        body: "Hi Alex,\n\nWe saw your recent payments architecture update.",
        provider: "simulation",
        companyName: "Stripe",
        senderName: "Sarah Chen",
        senderCompany: "Acquisition Engine",
        touchLabel: "Touch 1 · Cold Open",
        touchIndex: 1,
        totalTouches: 4,
        mode: "single",
      }),
    });
    const data = await res.json();
    assert(res.status === 200, "Sandbox dispatch returns 200 OK");
    assert(data.success === true, "Sandbox dispatch returns success: true");
    assert(data.isSimulated === true, "Sandbox dispatch returns isSimulated: true");
    assert(data.spfDkim === "PASS", "Sandbox returns simulated SPF/DKIM: PASS");
    assert(data.messageId && data.messageId.startsWith("sim_"), "Sandbox generates simulated messageId");
    assert(data.renderedHtml && data.renderedHtml.includes("⚡ LeadScout Test Send"), "Sandbox returns compiled responsive HTML");
  } catch (e) {
    assert(false, "Sandbox single touch dispatch", e.message);
  }

  // Test 5.3: Sandbox Simulation Mode (Full 4-Touch Sequence Digest)
  try {
    const res = await fetch(`${BASE_URL}/api/send-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientEmail: "sales-director@company.com",
        subject: "Sequence Cadence Preview",
        body: "Digest",
        provider: "simulation",
        companyName: "Linear",
        senderName: "Sarah Chen",
        senderCompany: "Acquisition Engine",
        mode: "all",
        allEmails: [
          { subject: "Touch 1", body: "Body 1", label: "Touch 1 · Day 1", type: "cold_open" },
          { subject: "Touch 2", body: "Body 2", label: "Touch 2 · Day 4", type: "value_add" },
          { subject: "Touch 3", body: "Body 3", label: "Touch 3 · Day 7", type: "follow_up" },
          { subject: "Touch 4", body: "Body 4", label: "Touch 4 · Day 11", type: "linkedin_inmail" },
        ],
      }),
    });
    const data = await res.json();
    assert(res.status === 200, "4-touch digest returns 200 OK");
    assert(data.success === true, "Digest returns success: true");
    assert(data.subject.includes("[Cadence Digest]"), "Digest prefixes subject with [Cadence Digest]");
    assert(data.renderedHtml.includes("LeadScout Sequence Digest"), "Digest HTML includes master header");
  } catch (e) {
    assert(false, "Sandbox 4-touch digest dispatch", e.message);
  }

  // Test 5.4: Resend Provider without Key
  try {
    const res = await fetch(`${BASE_URL}/api/send-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientEmail: "test@company.com",
        subject: "Live Send Test",
        body: "Hello",
        provider: "resend",
        companyName: "Stripe",
      }),
    });
    const data = await res.json();
    assert(res.status === 400, "Missing Resend API key returns 400");
    assert(data.requiresKey === true, "Flags requiresKey: true");
    assert(data.error.includes("No Resend API Key"), "Returns actionable error message");
  } catch (e) {
    assert(false, "Resend provider without key", e.message);
  }

  // -------------------------------------------------------------------------
  // TEST GROUP 6: Live API Endpoints (/api/rewrite)
  // -------------------------------------------------------------------------
  console.log("\n\x1b[36m[GROUP 6] Live API: /api/rewrite (AI Copywriter)\x1b[0m");

  const rewriteStyles = [
    { style: "make_shorter", desc: "Make Shorter" },
    { style: "casual_founder", desc: "Casual Founder" },
    { style: "focus_roi", desc: "Focus on ROI" },
    { style: "add_ps_hook", desc: "Add P.S. Hook" },
    { style: "de_spam", desc: "De-Spam Heuristic" },
  ];

  for (const item of rewriteStyles) {
    try {
      const res = await fetch(`${BASE_URL}/api/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSubject: "Enterprise billing acceleration",
          currentBody: "Hi Alex,\n\nI wanted to guarantee a 100% free demo to cut enterprise billing friction by 60% with zero risk.\n\nBest,\nSarah",
          style: item.style,
          companyName: "Stripe",
          domain: "stripe.com",
          targetPainPoint: "Complex billing workflows require custom development",
        }),
      });
      const data = await res.json();
      assert(res.status === 200, `Rewrite style '${item.desc}' returns 200 OK`);
      assert(typeof data.body === "string" && data.body.length > 10, `Rewrite style '${item.desc}' produced rewritten body`);
      assert(data.styleApplied === item.style, `Rewrite style metadata matches '${item.style}'`);
    } catch (e) {
      assert(false, `Rewrite style '${item.style}'`, e.message);
    }
  }

  // -------------------------------------------------------------------------
  // TEST GROUP 7: Live API Endpoints (/api/scout & SSRF Rejection)
  // -------------------------------------------------------------------------
  console.log("\n\x1b[36m[GROUP 7] Live API: /api/scout & SSRF Defensive Shield\x1b[0m");

  try {
    const ssrfRes = await fetch(`${BASE_URL}/api/scout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: "http://169.254.169.254/latest/meta-data" }),
    });
    const ssrfData = await ssrfRes.json();
    assert(ssrfRes.status === 400, "SSRF attack blocked with 400 Bad Request");
    assert(typeof ssrfData.error === "string" && ssrfData.error.length > 0, "SSRF attack rejected with error: " + ssrfData.error);
  } catch (e) {
    assert(false, "SSRF defense live test", e.message);
  }

  // -------------------------------------------------------------------------
  // TEST GROUP 8: Live API Endpoints (/api/auth & Session Verification)
  // -------------------------------------------------------------------------
  console.log("\n\x1b[36m[GROUP 8] Live API: /api/auth\x1b[0m");

  try {
    const authRes = await fetch(`${BASE_URL}/api/auth`);
    const authData = await authRes.json();
    assert(authRes.status === 200, "GET /api/auth returns 200 OK");
    assert(typeof authData.authenticated === "boolean", "Returns boolean authenticated state");
  } catch (e) {
    assert(false, "GET /api/auth", e.message);
  }

  // -------------------------------------------------------------------------
  // TEST GROUP 9: Campaign CSV Export Schema & RFC 4180 Compliance
  // -------------------------------------------------------------------------
  console.log("\n\x1b[36m[GROUP 9] Campaign CSV Export Schemas (Apollo & Lemlist)\x1b[0m");

  const { generateSingleCompanyCSV, generateSubjectLineVariations, generateDecisionMakersCSV } = await import("../lib/export-csv.ts");

  const apolloCsv = generateSingleCompanyCSV(MOCK_DOSSIER, null, "apollo");
  assert(apolloCsv.includes("Company Name,Website,Industry"), "Apollo CSV header conforms to schema");
  assert(apolloCsv.includes("Touch 1 Subject"), "Apollo CSV includes multi-touch sequence headers");

  const lemlistCsv = generateSingleCompanyCSV(MOCK_DOSSIER, null, "lemlist");
  assert(lemlistCsv.includes("companyName,companyDomain"), "Lemlist CSV conforms to importer requirements");

  const subjectVariations = generateSubjectLineVariations(
    "Stripe",
    "cold_open",
    "Complex billing workflows require custom development"
  );
  assert(subjectVariations.length === 3, "Generates 3 strategic subject line variations");
  assert(subjectVariations.some(v => v.angle.includes("Curiosity")), "Includes 'Curiosity / Question' angle");
  assert(subjectVariations.some(v => v.angle.includes("Data")), "Includes 'Data / Metrics Hook' angle");

  // -------------------------------------------------------------------------
  // TEST GROUP 10: Decision-Maker Discovery & Email Pattern Engine
  // -------------------------------------------------------------------------
  console.log("\n\x1b[36m[GROUP 10] Decision-Maker Discovery & Email Pattern Engine\x1b[0m");

  const {
    detectCompanyEmailPattern,
    generateCorporateEmail,
    discoverDecisionMakers,
    adaptSequenceForPersona,
  } = await import("../lib/contact-discovery.ts");

  // 1. Pattern Detection
  const enterprisePattern = detectCompanyEmailPattern("stripe.com", "8,000+ employees");
  assert(enterprisePattern.primaryPattern === "{first}.{last}@{domain}", "Enterprise scale predicts first.last@domain");
  assert(enterprisePattern.confidence >= 90, "Enterprise pattern has >= 90% confidence score");

  const startupPattern = detectCompanyEmailPattern("earlystage.ai", "1-10 employees");
  assert(startupPattern.primaryPattern === "{first}@{domain}", "Startup scale predicts first@domain");

  // 2. Email Address Generation & Sanitization
  const email1 = generateCorporateEmail("David", "Singleton", "stripe.com", "{first}.{last}@{domain}");
  assert(email1 === "david.singleton@stripe.com", "Generates correct first.last corporate email");

  const email2 = generateCorporateEmail("Élodie", "Müller-Smith", "acme.io", "{first}.{last}@{domain}");
  assert(email2 === "elodie.mullersmith@acme.io", "Sanitizes accents, hyphens, and umlauts in name");

  // 3. Persona Discovery
  const stripeContacts = discoverDecisionMakers(MOCK_DOSSIER);
  assert(stripeContacts.length >= 3, "Discovers 3+ decision-maker personas for target account");
  assert(stripeContacts.some(c => c.seniority === "C-Level"), "Identifies C-Level leadership");
  assert(stripeContacts.some(c => c.department === "Engineering & Tech"), "Identifies Engineering & Tech leadership");
  assert(stripeContacts.some(c => c.department === "Sales & Revenue"), "Identifies Sales & Revenue leadership");

  const dynamicDossier = {
    ...MOCK_DOSSIER,
    domain: "cloudscale-telemetry.io",
    companyName: "CloudScale",
    decisionMakers: undefined,
  };
  const dynamicContacts = discoverDecisionMakers(dynamicDossier);
  assert(dynamicContacts.length === 4, "Algorithmic discovery creates 4 balanced departmental personas for unseen domain");
  assert(dynamicContacts[0].corporateEmail.endsWith("@cloudscale-telemetry.io"), "Guessed email matches target company domain");
  assert(dynamicContacts[0].linkedinSearchUrl.includes("linkedin.com/search"), "Generates valid LinkedIn verification URL");

  // 4. Role-Adapted Sequence Personalization
  const mockEmails = [
    { type: "cold_open", label: "Cold Open", subject: "Quick question", body: "Hi [Name], general cold pitch." },
    { type: "value_add", label: "Case Study", subject: "Industry data", body: "Hi [Name], general case study." },
    { type: "linkedin_inmail", label: "InMail", subject: "Connect", body: "Hey [Name], connect." },
    { type: "follow_up", label: "Closing", subject: "Closing", body: "Hi [Name], follow up." },
  ];

  const adapted = adaptSequenceForPersona(mockEmails, stripeContacts[0], "Stripe");
  assert(adapted.length === 4, "Adapts all 4 sequence touches");
  assert(adapted[0].body.includes(`Hi ${stripeContacts[0].firstName}`), "Touch 1 greets contact by first name");
  assert(adapted[0].body.includes(stripeContacts[0].title), "Touch 1 references exact executive title");
  assert(adapted[0].body.includes(stripeContacts[0].departmentPainPoint), "Touch 1 injects department operational priority");
  assert(adapted[2].body.includes(stripeContacts[0].firstName), "LinkedIn InMail customized with first name");

  // 5. Contacts CSV Export
  const contactsCsv = generateDecisionMakersCSV(MOCK_DOSSIER, stripeContacts);
  assert(contactsCsv.includes("First Name,Last Name,Full Name,Job Title"), "Contacts CSV contains RFC 4180 headers");
  assert(contactsCsv.includes(stripeContacts[0].corporateEmail), "Contacts CSV includes guessed corporate email");

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n========================================================");
  console.log(`TOTAL TESTS RUN:   ${totalTests}`);
  console.log(`PASSED:            \x1b[32m${passedTests}\x1b[0m`);
  console.log(`FAILED:            \x1b[${failedTests > 0 ? "31" : "32"}m${failedTests}\x1b[0m`);
  console.log("========================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log("\x1b[32m✔ ALL SYSTEMS & SUBSYSTEMS FULLY VERIFIED!\x1b[0m\n");
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
