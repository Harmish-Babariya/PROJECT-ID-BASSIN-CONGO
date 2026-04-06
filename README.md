# ID Bassin Congo — EUDR Traceability Platform

Digital traceability and EUDR-compliant infrastructure for agricultural supply chains in the Congo Basin region.

## Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + PostGIS), Supabase Auth, Row Level Security (RLS)
- **Mapping**: Mapbox GL JS
- **Deployment**: Vercel (production), Supabase (cloud instance)
- **Storage**: Supabase Storage (GPX files)

## Project Structure

```
├── platform-website-and-map/
├── lots-frontend/
├── map-frontend/
```

### 1. `platform-website-and-map/`

Contains all files related to the main platform website, including:

- Login page and authentication flow
- Platform dashboard accessible after login
- Producer data and parcel visualization on interactive maps
- UI structure and layout reference for how the platform should be organized

> **Access credentials for the test environment are shared privately — never stored in the repository.**

### 2. `lots-frontend/`

Contains code and files related to lot management, including:

- Lot management interface and workflows
- Python script for EUDR deforestation compliance verification
- Two import scripts for uploading lot data from Excel files to Supabase
- - Backend scripts including the Hansen-based EUDR verification system for deforestation analysis.
- Copy `.env.example` and fill in your values:

```bash
cp .env.example .env.local

### 3. `map-frontend/`

Contains a standalone map application providing:

- World map view with Mapbox GL JS integration
- Parcel polygon visualization for producers
- Geographic data display connected to Supabase

* Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL access token |

> **Never commit real API keys or secrets to the repository. Use environment variables only.**

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see above)
4. Run the development server: `npm run dev`
5. Open `http://localhost:3000`

## Security Rules

- No API keys or secrets hardcoded in source code
- All secrets managed via Vercel and Supabase environment variables
- Supabase `service_role` key must never be exposed client-side
- Row Level Security (RLS) must be enabled on all tables
- Production data must not be used in development without explicit authorization

