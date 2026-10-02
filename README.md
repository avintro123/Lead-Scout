<div align="center">

# LeadScout

**Autonomous B2B Lead Intelligence & Multi-Touch Outreach Engine**

Turn any company domain or market niche query into an executive research dossier and a 4-touch personalized outreach sequence in seconds.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-4285F4?style=flat&logo=google)](https://aistudio.google.com/)
[![Jina AI](https://img.shields.io/badge/Jina_Reader-Scraping-blueviolet?style=flat)](https://jina.ai/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Features](#-key-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Environment Variables](#-environment-variables) • [Deployment](#-deployment) • [Keyboard Shortcuts](#-keyboard-shortcuts)

</div>

---

## Overview

**LeadScout** replaces hours of manual B2B sales prospect research. Enter a domain (e.g., `stripe.com`) or target market query, and the autonomous pipeline extracts live DOM content, synthesizes ICP positioning, identifies high-impact operational friction points, and generates structured outreach campaigns based on the **Pain-Agitate-Solution (PAS)** copywriting framework.

Designed with a restrained, human-crafted B2B product aesthetic inspired by Linear, Stripe, and Vercel.

---

## Key Features

- **DOM Extraction via Jina Reader**: Converts live target websites into clean, token-efficient markdown without the latency and memory overhead of headless browsers.
- **Deep Intelligence Synthesis**: Powered by **Google Gemini 2.0 Flash** to parse company positioning, business model, estimated employee headcount, target audience, and technology stacks.
- **Operational Friction Discovery**: Uncovers 3 acute enterprise friction angles with tailored sales talk tracks for discovery calls.
- **4-Touch Multi-Cadence Sequences**:
  - **Touch 1 (Day 1)**: Initial Outreach (Cold Open, <90 words)
  - **Touch 2 (Day 4)**: Strategic Angle (Case study & industry data)
  - **Touch 3 (Day 7)**: LinkedIn InMail (Conversational connection message)
  - **Touch 4 (Day 11)**: Closing Touch (Zero-pressure soft breakup)
- **Dynamic Sender Persona**: Injects your name, company, title, and value proposition directly into email templates with one-click token toggling.
- **Dual Persistence Architecture**: Real-time cloud sync with **Supabase PostgreSQL** paired with offline-first browser storage—ensuring zero data loss even without cloud credentials configured.
- **Executive CRM Directory**: Filter, search, and inspect past target accounts with 1-click Markdown (`.md`) and JSON export capabilities.
- **Settings & API Testing**: In-app Google Gemini API key validator (`/api/test-key`) to verify credentials instantly without restarting the server.

---

## Architecture

```
                    ┌────────────────────────┐
                    │ Target Input / Domain  │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │   /api/scout (POST)    │
                    │  Jina Reader Scraping  │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │  /api/analyze (POST)   │
                    │  Google Gemini 2.0     │
                    └───────────┬────────────┘
                                │
            ┌───────────────────┴───────────────────┐
            ▼                                       ▼
┌────────────────────────┐              ┌────────────────────────┐
│   Executive Dossier    │              │   4-Touch Cadence      │
│ • ICP & Audience       │              │ • Cold Open (Day 1)    │
│ • Value Propositions   │              │ • Case Study (Day 4)   │
│ • 3 Friction Angles    │              │ • LinkedIn InMail (D7) │
│ • Tech Stack Tags      │              │ • Soft Breakup (Day 11)│
└───────────┬────────────┘              └───────────┬────────────┘
            │                                       │
            └───────────────────┬───────────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │    Dual Persistence    │
                    │ • Supabase PostgreSQL  │
                    │ • LocalStorage Fallback│
                    └────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router, Turbopack) | Fast full-stack React framework with server routes |
| **Language** | TypeScript 5 | Strict static typing and end-to-end data contracts |
| **Styling** | Tailwind CSS v4 & Inter Font | Restrained, high-density neutral design system |
| **Intelligence** | Google Gemini 2.0 Flash (`@google/genai`) | Low-latency structured JSON intelligence synthesis |
| **Scraping** | Jina Reader API (`r.jina.ai`) | Zero-config markdown web extraction |
| **Database** | Supabase (PostgreSQL) + LocalStorage | Cloud synchronization with reliable offline fallback |
| **Icons** | Lucide React | Clean, consistent interface iconography |

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/avintro123/Lead-Scout.git
cd Lead-Scout
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:

```ini
# Google Gemini API Key (Free tier available at https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Database (Optional — free tier at https://supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

> **Note:** LeadScout includes smart offline presets (`stripe.com`, `notion.so`, `linear.app`, `supabase.com`) and an in-app fallback synthesizer. You can run the application immediately even before configuring cloud keys.

### 4. Setup Database Schema (Optional)

If using Supabase for cloud persistence:
1. Open your Supabase Dashboard &rarr; **SQL Editor**.
2. Run the queries inside [`supabase-schema.sql`](./supabase-schema.sql).

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Required | Description |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key used for company intelligence synthesis and outreach generation. Can also be entered dynamically in the app's **Settings** view. |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Your Supabase project URL for cloud-persisted lead storage. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anonymous public API key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Service role key for elevated backend operations. |

---

## Project Structure

```
lead-scout/
├── app/
│   ├── api/
│   │   ├── analyze/       # Gemini 2.0 Flash intelligence & copy generation
│   │   ├── leads/         # Supabase CRUD endpoints (GET, POST, DELETE)
│   │   ├── scout/         # Jina Reader web scraping route
│   │   └── test-key/      # API key validation endpoint
│   ├── globals.css        # Tailwind v4 design system tokens
│   ├── layout.tsx         # Root layout with Inter font optimization
│   └── page.tsx           # Main application workbench & view router
├── components/
│   ├── ActivityTimeline.tsx # Live pipeline execution tracker
│   ├── CompaniesView.tsx    # CRM table with search, filter, and exports
│   ├── CompanyProfile.tsx   # Executive dossier & outreach tabs
│   ├── SettingsView.tsx     # API credential tester & sender persona
│   └── Sidebar.tsx          # Workspace navigation & recent targets rail
├── lib/
│   ├── mock-data.ts       # Presets and offline fallback synthesizer
│   ├── storage.ts         # Unified LocalStorage persistence layer
│   ├── supabase.ts        # Supabase client initializer
│   └── types.ts           # Shared TypeScript interfaces & models
├── public/                # Static assets & favicons
├── supabase-schema.sql    # Database schema with indexes & RLS policies
└── package.json           # Dependencies and build scripts
```

---

## Keyboard Shortcuts

LeadScout supports quick navigation without touching your mouse:

| Key | Action |
| :---: | :--- |
| <kbd>R</kbd> | Navigate to **Research** |
| <kbd>C</kbd> | Navigate to **Companies Directory** |
| <kbd>S</kbd> | Navigate to **Settings** |
| <kbd>Enter</kbd> | Trigger research analysis when inside search input |

---

## Deployment

### Deploy to Vercel

The easiest way to deploy LeadScout is via [Vercel](https://vercel.com):

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com/new).
3. Under **Environment Variables**, add `GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Click **Deploy**.

---

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for more information.
