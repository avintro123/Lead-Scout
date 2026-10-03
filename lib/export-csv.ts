import { CompanyDossier, OutreachEmail, LeadRecord } from "./types";

/**
 * Escapes fields according to RFC 4180 CSV standard.
 * Wraps in double quotes and escapes existing double quotes with two double quotes.
 */
export function escapeCSV(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const str = String(value).trim();
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Generates an Apollo.io / Instantly compatible CSV for a single company dossier.
 */
export function generateSingleCompanyCSV(
  dossier: CompanyDossier,
  emails: OutreachEmail[],
  format: "apollo" | "lemlist" = "apollo"
): string {
  const painPoints = dossier.top3PainPoints || [];
  const p1 = painPoints[0] || "";
  const p2 = painPoints[1] || "";
  const p3 = painPoints[2] || "";

  const touch1 = emails[0] || { subject: "", body: "" };
  const touch2 = emails[1] || { subject: "", body: "" };
  const touch3 = emails[2] || { subject: "", body: "" };
  const touch4 = emails[3] || { subject: "", body: "" };

  if (format === "lemlist") {
    const headers = [
      "companyName",
      "companyDomain",
      "industry",
      "headcount",
      "painPoint1",
      "painPoint2",
      "painPoint3",
      "subject1",
      "body1",
      "subject2",
      "body2",
      "linkedinMessage",
      "subject4",
      "body4",
    ];

    const row = [
      escapeCSV(dossier.companyName),
      escapeCSV(dossier.domain),
      escapeCSV(dossier.industryTags?.join(", ")),
      escapeCSV(dossier.estimatedHeadcount),
      escapeCSV(p1),
      escapeCSV(p2),
      escapeCSV(p3),
      escapeCSV(touch1.subject),
      escapeCSV(touch1.body),
      escapeCSV(touch2.subject),
      escapeCSV(touch2.body),
      escapeCSV(touch3.body),
      escapeCSV(touch4.subject),
      escapeCSV(touch4.body),
    ];

    return `${headers.join(",")}\n${row.join(",")}\n`;
  }

  // Default: Apollo.io / Instantly / Smartlead standard
  const headers = [
    "Company Name",
    "Website",
    "Industry",
    "Estimated Employees",
    "Business Model",
    "Primary Pain Point",
    "Secondary Pain Point",
    "Touch 1 Subject",
    "Touch 1 Body",
    "Touch 2 Subject",
    "Touch 2 Body",
    "Touch 3 LinkedIn InMail",
    "Touch 4 Subject",
    "Touch 4 Body",
  ];

  const row = [
    escapeCSV(dossier.companyName),
    escapeCSV(dossier.domain),
    escapeCSV(dossier.industryTags?.join(", ")),
    escapeCSV(dossier.estimatedHeadcount),
    escapeCSV(dossier.estimatedBusinessModel),
    escapeCSV(p1),
    escapeCSV(p2),
    escapeCSV(touch1.subject),
    escapeCSV(touch1.body),
    escapeCSV(touch2.subject),
    escapeCSV(touch2.body),
    escapeCSV(touch3.body),
    escapeCSV(touch4.subject),
    escapeCSV(touch4.body),
  ];

  return `${headers.join(",")}\n${row.join(",")}\n`;
}

/**
 * Generates bulk CSV from multiple saved lead records.
 */
export function generateBulkCompaniesCSV(
  leads: LeadRecord[],
  format: "apollo" | "lemlist" = "apollo"
): string {
  if (leads.length === 0) return "";

  const isLemlist = format === "lemlist";
  const headers = isLemlist
    ? [
        "companyName",
        "companyDomain",
        "objective",
        "industry",
        "headcount",
        "painPoint1",
        "painPoint2",
        "painPoint3",
        "subject1",
        "body1",
        "subject2",
        "body2",
        "linkedinMessage",
        "subject4",
        "body4",
      ]
    : [
        "Company Name",
        "Website",
        "Pitch Objective",
        "Industry",
        "Estimated Employees",
        "Business Model",
        "Primary Pain Point",
        "Secondary Pain Point",
        "Touch 1 Subject",
        "Touch 1 Body",
        "Touch 2 Subject",
        "Touch 2 Body",
        "Touch 3 LinkedIn InMail",
        "Touch 4 Subject",
        "Touch 4 Body",
      ];

  const rows = leads.map((lead) => {
    const d = lead.dossier_json?.dossier || {
      companyName: lead.company_name,
      domain: lead.domain,
      industryTags: [],
      estimatedHeadcount: "",
      estimatedBusinessModel: "",
      top3PainPoints: [],
    };
    const emails = lead.dossier_json?.emails || [];
    const p1 = d.top3PainPoints?.[0] || "";
    const p2 = d.top3PainPoints?.[1] || "";
    const p3 = d.top3PainPoints?.[2] || "";

    const t1 = emails[0] || { subject: "", body: "" };
    const t2 = emails[1] || { subject: "", body: "" };
    const t3 = emails[2] || { subject: "", body: "" };
    const t4 = emails[3] || { subject: "", body: "" };

    if (isLemlist) {
      return [
        escapeCSV(d.companyName),
        escapeCSV(d.domain),
        escapeCSV(lead.objective),
        escapeCSV(d.industryTags?.join(", ")),
        escapeCSV(d.estimatedHeadcount),
        escapeCSV(p1),
        escapeCSV(p2),
        escapeCSV(p3),
        escapeCSV(t1.subject),
        escapeCSV(t1.body),
        escapeCSV(t2.subject),
        escapeCSV(t2.body),
        escapeCSV(t3.body),
        escapeCSV(t4.subject),
        escapeCSV(t4.body),
      ].join(",");
    }

    return [
      escapeCSV(d.companyName),
      escapeCSV(d.domain),
      escapeCSV(lead.objective?.replace(/_/g, " ")),
      escapeCSV(d.industryTags?.join(", ")),
      escapeCSV(d.estimatedHeadcount),
      escapeCSV(d.estimatedBusinessModel),
      escapeCSV(p1),
      escapeCSV(p2),
      escapeCSV(t1.subject),
      escapeCSV(t1.body),
      escapeCSV(t2.subject),
      escapeCSV(t2.body),
      escapeCSV(t3.body),
      escapeCSV(t4.subject),
      escapeCSV(t4.body),
    ].join(",");
  });

  return `${headers.join(",")}\n${rows.join("\n")}\n`;
}

/**
 * Downloads a string as a CSV file in the browser.
 */
export function triggerCSVDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface SubjectVariation {
  angle: "Direct / Pain Point" | "Curiosity / Question" | "Data / Metrics Hook";
  subject: string;
}

/**
 * Generates 3 strategic A/B subject line alternatives for any touchpoint.
 */
export function generateSubjectLineVariations(
  companyName: string,
  touchType: string,
  primaryPainPoint?: string
): SubjectVariation[] {
  const cleanCompany = companyName || "your team";
  const shortPain = primaryPainPoint
    ? primaryPainPoint.split(" ").slice(0, 5).join(" ").replace(/[.,;]$/, "")
    : "enterprise scaling bottlenecks";

  if (touchType === "cold_open") {
    return [
      {
        angle: "Direct / Pain Point",
        subject: `Solving ${cleanCompany}'s ${shortPain}?`,
      },
      {
        angle: "Curiosity / Question",
        subject: `Quick question regarding ${cleanCompany}'s onboarding workflow`,
      },
      {
        angle: "Data / Metrics Hook",
        subject: `Cutting implementation time by 45% for ${cleanCompany}`,
      },
    ];
  }

  if (touchType === "value_add") {
    return [
      {
        angle: "Direct / Pain Point",
        subject: `3 patterns we are seeing in ${cleanCompany}'s market segment`,
      },
      {
        angle: "Curiosity / Question",
        subject: `How peer teams are tackling ${shortPain}`,
      },
      {
        angle: "Data / Metrics Hook",
        subject: `Benchmark: 2.8x conversion lift for companies like ${cleanCompany}`,
      },
    ];
  }

  if (touchType === "linkedin_inmail") {
    return [
      {
        angle: "Direct / Pain Point",
        subject: `Friction-free workflow for ${cleanCompany}`,
      },
      {
        angle: "Curiosity / Question",
        subject: `Growth velocity for ${cleanCompany} this quarter?`,
      },
      {
        angle: "Data / Metrics Hook",
        subject: `10-minute discovery on ${cleanCompany}'s pipeline`,
      },
    ];
  }

  // follow_up / breakup
  return [
    {
      angle: "Direct / Pain Point",
      subject: `Re: ${cleanCompany} growth notes (closing the loop)`,
    },
    {
      angle: "Curiosity / Question",
      subject: `Should I cross this off your radar, ${cleanCompany}?`,
    },
    {
      angle: "Data / Metrics Hook",
      subject: `Re: 15-minute sync regarding ${cleanCompany}`,
    },
  ];
}
