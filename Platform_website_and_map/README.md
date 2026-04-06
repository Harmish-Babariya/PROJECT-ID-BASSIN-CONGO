# ID BASSIN DU CONGO — Developer Guide - Platform_website_and_map

Traceability platform for coffee and cocoa supply chains in the Congo Basin.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + PostGIS) |
| Maps | Mapbox GL |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<repo-url>/idbassin.git
cd idbassin
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file at the root of the project:

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in the values provided separately by the project owner:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=...
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Test Account

Use these credentials to log in at `/connexion`:

```
Email:    test@gmail.com
Password: test
```

---

## Project Structure

```
idbassin/
├── app/
│   ├── components/
│   │   ├── Navigation.tsx        # Top navigation bar + language switcher
│   │   ├── CentralAfricaMap.tsx  # Mapbox interactive map (homepage)
│   │   └── EchofieldPattern.tsx  # Decorative SVG pattern
│   ├── contexts/
│   │   └── LanguageContext.tsx   # FR/EN language context (React)
│   ├── dashboard/
│   │   ├── page.tsx              # Main dashboard (plots overview)
│   │   ├── recherche/            # Map search + plot filtering
│   │   ├── analytics/            # Charts and statistics
│   │   └── dds/                  # Due Diligence Statement generator
│   ├── plateforme/               # Platform features page
│   ├── approche/                 # Approach page
│   ├── eudr-esg/                 # EUDR & ESG compliance page
│   ├── contact/                  # Contact form
│   ├── connexion/                # Login page
│   ├── layout.tsx                # Root layout (fonts, providers)
│   ├── page.tsx                  # Homepage
│   └── globals.css               # Global styles + design tokens
├── lib/
│   └── supabase.ts               # Supabase client + geo utilities
├── public/                       # Static assets (images, videos)
├── .env.example                  # Environment variables template
├── .env.local                    # Your local secrets — NEVER commit this
├── package.json
└── tsconfig.json
```

---

## Key Features

### Language Switcher (FR / EN)
- Managed via `app/contexts/LanguageContext.tsx`
- Toggle with the 🇫🇷 / 🇬🇧 flags in the top-right navigation
- Language preference is saved in `localStorage`
- To add a translation, update the `translations` object in each page file

### Supabase Database
- Client initialized in `lib/supabase.ts`
- Main table: `parcelles_geojson` (plot geometries as GeoJSON)
- Area calculation and geometry parsing utilities are in the same file

### Mapbox Map
- Used in `app/components/CentralAfricaMap.tsx` (homepage)
- Also used in `app/dashboard/recherche/` for plot visualization
- Requires `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` in `.env.local`

### Dashboard
- `/dashboard` — plot overview + statistics
- `/dashboard/recherche` — map-based plot search with filters
- `/dashboard/analytics` — charts (Recharts)
- `/dashboard/dds` — generates Due Diligence Statements (EUDR compliance)

---

## Design System

All design tokens are defined in `app/globals.css`:

| Token | Value | Usage |
|---|---|---|
| `--congo-cyan` | `#2AC1A3` | Primary color, CTAs |
| `--ochre-terre` | `#A67C52` | Secondary / institutional |
| `--ink-black` | `#1A1A1A` | Text, backgrounds |
| `--tech-gray` | `#2D3436` | Body text, UI elements |
| `--off-white` | `#FEFCF7` | Page background |

Fonts:
- **Archivo Narrow** — headings and body text
- **Courier Prime** — data labels, metadata, monospace elements

---

## Available Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Notes

- `.env.local` is excluded from Git — never commit it
- The `node_modules/` and `.next/` folders are also excluded
- All pages use the `"use client"` directive (client-side rendering)
- The login system is a simple credential check — authentication can be upgraded using Supabase Auth
