import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://lead-scout-2kcj-4137k2txi-avantiks-projects.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "LeadScout — Autonomous B2B Sales Intelligence & Outreach Engine",
  description:
    "Turn any company domain into an ICP fit score, executive research dossier, and high-converting 4-touch outreach sequence in 5 seconds.",
  keywords: [
    "B2B sales intelligence",
    "lead prospecting",
    "cold email sequencer",
    "ICP qualification",
    "AI sales copilot",
    "sales battlecards",
  ],
  authors: [{ name: "Avantik" }],
  openGraph: {
    title: "LeadScout — Autonomous B2B Sales Intelligence & Outreach Engine",
    description:
      "Turn any company domain into an ICP score, research dossier, and high-converting 4-touch outreach sequence in 5 seconds.",
    url: siteUrl,
    siteName: "LeadScout",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "LeadScout — Autonomous B2B Sales Intelligence & Outreach Engine",
    description:
      "Autonomous B2B lead intelligence and 4-touch email sequences generated in under 5 seconds.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
