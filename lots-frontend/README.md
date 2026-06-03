# ID Bassin Congo — Platform Documentation

> Agricultural traceability platform for EUDR compliance in the Congo Basin

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Key Functional Flows](#key-functional-flows)
- [Key Functionalities](#key-functionalities)
- [Authentication & Access Control](#authentication--access-control)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)

---

## Project Overview

**ID Bassin Congo** is a web platform that helps agricultural operators in the Congo Basin comply with the **EU Deforestation Regulation (EUDR)**. The regulation requires companies importing commodities like cocoa, coffee, and palm oil into the EU to prove their supply chain did not contribute to deforestation after December 31, 2020.

The platform covers the **full traceability chain**:

```
Farmer (Producteur)
  └── owns Land Parcels (Parcelles)
        └── each Parcel is verified against satellite data (EUDR status)
              └── Harvests (Collectes) link farmer × parcel × weight × date
                    └── bundled into a Shipment Lot (Lot)
                          └── Lot generates a Due Diligence Statement PDF (DDS)
                                └── DDS is submitted to EU authorities
```

### What the platform does

| For operators | For compliance officers |
|---|---|
| Register farmers and their land parcels | Run automated EUDR satellite analysis per parcel |
| Record every harvest with weight and quality | See compliance status across the entire supply chain |
| Bundle harvests into shipment lots | Generate legally-required Due Diligence Statement PDFs |
| Manage the full supply chain in one place | Export data to Excel for reporting |

### Who uses it

- **Admin** — full access to all data, manages users and master data
- **Focal Point** — field agent scoped to their assigned country/region, manages their own records

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16.1.1 | React framework, App Router, Server Actions |
| [React](https://react.dev/) | 19.2.3 | UI library |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility-first styling |
| [Lucide React](https://lucide.dev/) | 0.562 | Icon library |
| [Recharts](https://recharts.org/) | 3.6 | Dashboard charts and graphs |

### Backend & Database
| Technology | Version | Purpose |
|---|---|---|
| [Supabase](https://supabase.com/) | 2.89 | PostgreSQL database + file storage |
| [jose](https://github.com/panva/jose) / [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | 6.2 / 9.0 | JWT authentication tokens |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 3.0 | Password hashing |
| [Nodemailer](https://nodemailer.com/) + Mailjet | 8.0 | Transactional email (invitations) |

### Mapping
| Technology | Version | Purpose |
|---|---|---|
| [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) | 3.17 | Interactive satellite maps |
| [react-map-gl](https://visgl.github.io/react-map-gl/) | 8.1 | React wrapper for Mapbox |
| [@mapbox/mapbox-gl-geocoder](https://github.com/mapbox/mapbox-gl-geocoder) | 5.1 | Address search on maps |

### Data Processing
| Technology | Version | Purpose |
|---|---|---|
| [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js) | 0.6 | Parse GPX boundary files |
| [geotiff](https://geotiffjs.github.io/) | 3.0 | Read Hansen satellite raster tiles |
| [pdf-lib](https://pdf-lib.js.org/) | 1.17 | Generate DDS PDF documents |
| [xlsx](https://sheetjs.com/) | 0.18 | Excel export |
| [zod](https://zod.dev/) | 4.2 | Schema validation |

### Python Scripts (data migration / EUDR analysis)
| Library | Purpose |
|---|---|
| pandas, openpyxl | Read Excel migration files |
| supabase-py | Connect to Supabase from Python |
| gpxpy, shapely, pyproj | Parse and transform GPX geometries |
| rasterio | Read Hansen GeoTIFF satellite tiles |
| requests | Call Global Forest Watch API for protected areas |

---

## Installation & Setup

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9 (or pnpm / yarn)
- A **Supabase** project ([free tier](https://supabase.com/pricing) works for development)
- A **Mapbox** account with a public token ([free tier](https://www.mapbox.com/pricing) works)
- Optional: Python 3.10+ (only needed for data migration scripts)

### Step 1 — Clone the repository

```bash
git clone <repository-url>
cd lots-frontend
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env` — see the [Environment Variables](#environment-variables) section below for what each key means.

### Step 4 — Set up the Supabase database

In your Supabase project, run the SQL migrations to create all tables. The migrations are in `supabase/migrations/`. You can run them via the Supabase SQL Editor or the Supabase CLI:

```bash
# Using Supabase CLI
npx supabase db push
```

The main tables needed:
`producteurs`, `parcelles`, `collectes`, `lots`, `lot_collectes`, `pays`, `zones`, `villages`, `nationalites`, `user_profiles`, `user_sessions`, `audit_logs`, `dds`

### Step 5 — Create the first admin user

After setting up the database, create your first admin account directly in Supabase:

1. Go to **Supabase Dashboard → Authentication → Users → Add User**
2. Enter email and password, click **Create User**
3. Copy the new user's UUID
4. Go to **SQL Editor** and run:

```sql
INSERT INTO user_profiles (id, email, nom, prenom, role, statut, token_version)
VALUES (
  '<paste-user-uuid-here>',
  'your@email.com',
  'Your Last Name',
  'Your First Name',
  'admin',
  'actif',
  0
);
```

### Step 6 — Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

### Step 7 — (Optional) Run Python migration scripts

If you have existing data in Excel format:

```bash
cd python_scripts
pip install -r requirements.txt

# Copy and fill in environment variables for Python scripts
cp .env.example .env

# Run migrations in order
python migrate_excel_complet.py    # Import producers + parcels from Excel
python migrate_gestion_lots.py     # Import harvest collections from Excel
```

---

## Environment Variables

Create a `.env` file in the `lots-frontend/` root. All variables below are **required** unless marked optional.

```bash
# ─── Supabase ───────────────────────────────────────────────────────────────

# Your Supabase project URL
# Found in: Supabase Dashboard → Project Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co

# Public anon key — safe to expose to the browser, enforces Row Level Security
# Found in: Supabase Dashboard → Project Settings → API → anon / public
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service role key — SERVER ONLY, never expose this to the client or commit it
# Bypasses Row Level Security — used for all data service functions on the server
# Found in: Supabase Dashboard → Project Settings → API → service_role
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...


# ─── Authentication ──────────────────────────────────────────────────────────

# Secret string used to sign and verify JWT session tokens
# Generate a strong random value: openssl rand -base64 32
JWT_SECRET=your-super-secret-string-minimum-32-characters


# ─── Mapbox ──────────────────────────────────────────────────────────────────

# Public Mapbox token — used in the browser for satellite map rendering
# Get it at: mapbox.com → Account → Tokens → Create a token
# Restrict it to your domain in production
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6...


# ─── Email / Mailjet ─────────────────────────────────────────────────────────
# Used to send user invitation emails and password resets
# Create a free account at mailjet.com → API Keys
# If not set, email sending is silently skipped (useful in local dev)

MAILJET_API_KEY=your-mailjet-api-key          # optional in dev
MAILJET_API_SECRET=your-mailjet-api-secret    # optional in dev
MAILJET_FROM_EMAIL=noreply@yourdomain.com     # optional in dev
MAILJET_FROM_NAME=ID Bassin Congo             # optional in dev
```

### Security reference

| Variable | Exposed to browser? | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Safe — just a project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Safe — enforces Supabase RLS policies |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | Restrict to your domain in Mapbox dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | **Never** | Full DB access — server-side only |
| `JWT_SECRET` | **Never** | Session security — server-side only |
| `MAILJET_*` | **Never** | Server-side only |

---

## Project Structure

```
lots-frontend/
│
├── app/                              # Next.js App Router
│   │
│   ├── (admin)/                      # All authenticated pages (require login)
│   │   ├── layout.tsx                # Loads sidebar, stat counts, user session
│   │   │
│   │   ├── dashboard/                # Home screen — stats, map, recent activity
│   │   │
│   │   ├── producteurs/              # Farmer registry
│   │   │   ├── page.tsx              # List with search and filters
│   │   │   ├── nouveau/              # Create new farmer
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Farmer detail + parcels list
│   │   │       └── modifier/         # Edit farmer form
│   │   │
│   │   ├── parcelles/                # Land parcel management
│   │   │   ├── page.tsx              # List with EUDR status filter chips
│   │   │   ├── nouveau/              # Create parcel
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Detail + map + EUDR result + history
│   │   │       └── edit/             # Edit GPS, GPX upload, EUDR admin override
│   │   │
│   │   ├── collectes/                # Harvest collection CRUD
│   │   ├── lots/                     # Shipment lot management + LotMap
│   │   ├── export/                   # DDS list, generation, PDF viewer
│   │   ├── utilisateurs/             # User management (admin only)
│   │   ├── profil/                   # Current user profile + activity log
│   │   └── referentiel/              # Master data: countries, zones, villages
│   │
│   ├── api/                          # API routes — server-side only
│   │   ├── auth/                     # login, logout, register, invite, sessions
│   │   ├── verify-eudr/              # EUDR satellite analysis (single parcel)
│   │   ├── verify-eudr-batch/        # EUDR analysis (multiple parcels)
│   │   ├── analyse-gpx/              # Parse GPX file → GeoJSON polygon
│   │   ├── upload-gpx/               # Upload GPX file to Supabase Storage
│   │   ├── generate-dss/[lotId]/     # Generate DDS PDF for a lot
│   │   ├── utilisateurs/             # User invite / deactivate / delete
│   │   └── dds/                      # DDS record CRUD
│   │
│   ├── login/                        # Public login page
│   └── verify-invite/                # Email invite verification page
│
├── components/                       # Reusable UI components
│   ├── AdminLayout.tsx               # Main layout: sidebar + content area wrapper
│   ├── Sidebar.tsx                   # Navigation links + user menu + language toggle
│   ├── Toast.tsx                     # Success / error notifications (auto-dismiss 5s)
│   ├── Pagination.tsx                # Table pagination controls
│   ├── SortableHeader.tsx            # Clickable sortable table column headers
│   ├── ConfirmModal.tsx              # Confirmation dialog for destructive actions
│   ├── LanguageSwitcher.tsx          # FR / EN language toggle button
│   └── ProducteurFormFields.tsx      # Reusable farmer form field group
│
├── contexts/
│   └── LanguageContext.tsx           # Global locale state — "fr" | "en"
│
├── lib/
│   ├── services/                     # All database access (Supabase queries)
│   │   ├── auth.ts                   # getCurrentUser(), session bootstrap
│   │   ├── producteurs.ts            # Farmer CRUD + auto code generation
│   │   ├── parcelles.ts              # Parcel queries + EUDR status filter
│   │   ├── collectes.ts              # Harvest collection queries
│   │   ├── lots.ts                   # Lot queries + collection association
│   │   ├── referentiel.ts            # Countries, zones, villages CRUD
│   │   ├── scope.ts                  # ★ Access control — DataScope builder
│   │   ├── audit.ts                  # Activity log (every create/update/delete)
│   │   └── mail.ts                   # Email sending via Mailjet
│   │
│   ├── auth/
│   │   ├── jwt.ts                    # signToken(), verifyToken()
│   │   └── password.ts               # bcrypt hash / compare helpers
│   │
│   ├── i18n/
│   │   ├── translations.ts           # All FR + EN UI strings (~5000 keys)
│   │   ├── geo.ts                    # Translate place names per locale
│   │   └── justification.ts          # Re-render EUDR result sentences in active locale
│   │
│   ├── eudr.ts                       # EUDR status constants + normalisation logic
│   ├── supabase.ts                   # Client-side Supabase instance (anon key)
│   ├── supabase-server.ts            # Server-side Supabase instances (admin + SSR)
│   ├── api-errors.ts                 # Standardised API error codes and messages
│   └── env.ts                        # Typed env var access — throws if missing
│
├── middleware.ts                     # Route guard: redirects to /login if no token
│
├── python_scripts/                   # Data migration + EUDR analysis (Python)
│   ├── eudr_verification.py          # Satellite analysis: Hansen tiles + WDPA API
│   ├── migrate_excel_complet.py      # Bulk import producers + parcels from Excel
│   ├── migrate_gestion_lots.py       # Bulk import harvest collections from Excel
│   └── requirements.txt
│
├── supabase/migrations/              # Database migration SQL files
│
├── .env                              # Your local env file — never commit this
├── .env.example                      # Template — copy to .env to get started
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Key Functional Flows

### 1. User Login

```
User visits any protected page (e.g. /dashboard)
        │
        ▼
middleware.ts — checks for auth-token cookie on every request
        │
        ├── No cookie ──────► redirect to /login?redirect=/dashboard
        │
        └── Cookie found ───► verify JWT signature + compare tokenVersion with DB
                │
                ├── Invalid signature ──► redirect to /login
                ├── Token revoked      ──► redirect to /login
                └── Valid              ──► allow request through
```

When the user submits the login form:

```
POST /api/auth/login  { email, password, rememberMe }
  1. Look up user by email in user_profiles
  2. Compare password with bcrypt hash
  3. Sign JWT { userId, email, tokenVersion, sessionId }
  4. Set cookie: auth-token
       rememberMe = true  → expires in 30 days
       rememberMe = false → expires in 24 hours
  5. Record login in user_sessions table
  6. Redirect to /dashboard
```

---

### 2. Registering a Farmer and Parcel

```
Navigate to /producteurs/nouveau
        │
        ▼
Fill in farmer details (name, gender, date of birth, village, nationality...)
        │
        ▼
Server Action → createProducteur()
  1. Authenticate: getCurrentUser()
  2. Scope check: focal point can only create in their assigned country
  3. Auto-generate unique code:  CMR-CEN-482  (country + zone + random 3 digits)
  4. Insert row into producteurs table
  5. Write to audit_logs { action: "create", table: "producteurs" }
  6. Redirect to /producteurs/[new-id]
        │
        ▼
From producer detail page → "Add Parcel" button
        │
        ▼
Fill in parcel: GPS coordinates, surface, crop type
Optionally upload a GPX boundary file (see GPX section below)
        │
        ▼
Server Action → createParcelle()  (same auth + scope + audit pattern)
```

---

### 3. EUDR Parcel Verification

```
Open parcel detail page → click "Verify EUDR"
        │
        ▼
POST /api/verify-eudr  { parcelle_id }
        │
        ├── eudr_admin_override = true ──► skip analysis, return current status
        │
        └── Proceed with satellite analysis:
                │
                ▼
        Hansen GeoTIFF analysis (30m resolution satellite data):
          • Download tree cover year-2000 raster tile from Google Cloud
          • Download deforestation loss-year tiles (2001–2023)
          • Clip both tiles to the parcel polygon boundary
          • Calculate % of pixels with tree cover > 30% in 2000
          • Calculate % of pixels deforested after December 31, 2020
                │
                ▼
        WDPA protected area check:
          • Query Global Forest Watch API with polygon bounding box
          • Detect any overlap with IUCN-classified protected zones
                │
                ▼
        Decision tree:
          deforestation after 2020 > 5%  ──► NON CONFORME   (red)
          forest cover 2000 < 5%         ──► CONFORME        (green)
          overlap with protected area    ──► RISQUE           (yellow)
          otherwise                      ──► CONFORME        (green)
                │
                ▼
        Update parcelles row:
          status_eudr                 = result
          justification_eudr          = "Couverture forestière 2000 : 73%. Déforestation après 2020 : 0.2%."
          eudr_verification_timestamp = now()
```

---

### 4. Building a Shipment Lot

```
Navigate to /lots/nouveau → fill in lot details
(product type, destination country, buyer, expedition date)
        │
        ▼
Lot created with status "En préparation"
        │
        ▼
Go to /lots/[id]/edit → Collections tab
        │
        ▼
See all available harvest collections not yet assigned to another lot
Toggle each collection checkbox → live total weight recalculates instantly
        │
        ▼
Save → diff update to lot_collectes junction table
  (inserts new links, removes unchecked links)
        │
        ▼
Update lot status to "Prêt" when ready for export
```

---

### 5. Generating a Due Diligence Statement (DDS)

```
Navigate to /export/generate → select the lot
        │
        ▼
POST /api/generate-dss/[lotId]
        │
        ▼
  1. Fetch lot + all collections + all linked parcels
  2. Fetch logged-in user profile (appears in PDF footer)
  3. Build PDF using pdf-lib:
     ┌──────────────────────────────────────┐
     │  LOGO   |  DDS-2025-047              │
     │         |  Date: 03/06/2025          │
     ├──────────────────────────────────────┤
     │  LOT INFORMATION                     │
     │  Product   Weight   Destination      │
     │  Buyer     Expedition date           │
     ├──────────────────────────────────────┤
     │  PARCEL TABLE                        │
     │  Code | Ha | Culture | GPS | Status  │
     ├──────────────────────────────────────┤
     │  Agent: Jean Dupont (CMR-001)        │
     └──────────────────────────────────────┘
  4. Upload PDF to Supabase Storage
  5. Insert record into dds table (reference_code, lot_id, pdf_url)
  6. Return { pdf_url }
        │
        ▼
User downloads PDF → submits to EU TRACES portal
```

---

## Key Functionalities

### GPX File Processing

When a field agent uploads a `.gpx` file to define a parcel's boundary:

```
User selects .gpx file in the parcel edit form
        │
        ▼
Step 1 — POST /api/upload-gpx
  • Validates file is .gpx type
  • Uploads to Supabase Storage bucket "gpx-files"
  • Returns a public URL for the file
        │
        ▼
Step 2 — POST /api/analyse-gpx  { url: "<storage-url>" }
  • Downloads the GPX file content
  • Parses XML with xml2js
  • Extracts all track points (trkpt) with lat/lon coordinates
  • Builds a GeoJSON Polygon from the coordinate ring
  • Computes the centroid (average of all lat/lon values)
  • Calculates surface area in hectares using the Haversine formula
  • Returns { geojson, latitude, longitude, surface_ha }
        │
        ▼
Form auto-fills: GPS fields + surface area
Map preview shows the polygon outline
        │
        ▼
User saves → parcelle row updated:
  geojson       = { type: "Polygon", coordinates: [...] }
  gpx_file_url  = "https://...supabase.co/storage/..."
  latitude      = centroid lat
  longitude     = centroid lon
  surface_ha    = calculated area
```

The `geojson` column is then used by:
- All map components to render the polygon fill and outline
- The EUDR verification API to clip satellite tiles to the parcel boundary
- The DDS PDF generator for parcel boundary metadata

---

### Scope-Based Data Access

Every database query automatically filters data based on who is logged in. This is invisible to users but fundamental to the platform:

```typescript
// lib/services/scope.ts

// Admin      → scope = null            → no filter, sees everything
// Focal point → scope = {              → filtered query
//   paysIds: [2, 5],                   // countries this agent covers
//   createdBy: "user-uuid-abc"         // their user ID
// }

const scope = buildScope(user)

// Applied automatically in every service function:
if (scope) {
  query = query
    .in("pays_id", scope.paysIds)       // only their assigned countries
    .eq("created_by", scope.createdBy)  // only records they personally created
}
```

This means two focal points working in the same country cannot see each other's farmers or parcels — each agent manages their own data independently.

---

### Multilingual Interface (FR / EN)

The entire platform supports French (default) and English. Language is toggled from the sidebar and saved to `localStorage`:

```typescript
const { t } = useLanguage()

// All UI strings use translation keys — no hardcoded text in components:
<button>{t.common.viewPlot}</button>             // "VOIR PARCELLE" or "VIEW PLOT"
<h2>{t.lots.sectionCollectes(3)}</h2>            // "3 collectes" or "3 collections"
<p>{t.parcelles.eudrStatusLabel}</p>             // "Statut EUDR" or "EUDR Status"
```

EUDR justification sentences are stored in French in the database and automatically translated to English on display using regex pattern matching in `lib/i18n/justification.ts`.

---

### Interactive Parcel Maps

All maps use Mapbox GL with satellite imagery as the default view.

| Map | Where | What it shows |
|---|---|---|
| Dashboard map | `/dashboard` | All parcels in scope, color-coded by EUDR status |
| Lot map | `/lots/[id]` | Only the parcels belonging to this lot |
| Parcel map | `/parcelles/[id]` | Single parcel zoomed in |

Key behaviors:
- **Auto-zoom on load**: the map automatically fits the viewport to the actual polygon coordinates, regardless of where in the world the parcel is located
- **VIEW PLOT button** (lot map): opens a dropdown listing all parcels in the lot; clicking one flies the camera to that parcel's exact location
- **Style toggle**: switch between Satellite, Street Map, and Terrain views
- **EUDR color coding**: green = compliant, red = non-compliant, yellow = risk, orange = pending

---

## Authentication & Access Control

### How sessions work

The app uses **JWT tokens stored in httpOnly cookies** — not localStorage. This prevents JavaScript from reading the token and protects against XSS attacks.

```
Login  → server creates JWT → sets httpOnly cookie: auth-token
Request → middleware reads cookie → verifies JWT → allows or redirects
Logout  → server clears the cookie → session ends
```

The JWT contains: `userId`, `email`, `tokenVersion`, `sessionId`.

### Role system

| Role | Permissions |
|---|---|
| **admin** | View and edit all data across all countries. Manage users (invite, deactivate, delete). Manage master data (countries, zones, villages). |
| **focal_point** | View and edit only data in their assigned countries, and only records they personally created. Cannot access user management or master data. |

### Instant session revocation

Each user has a `token_version` integer stored in the database. The JWT contains this value at the time of signing. On every request:

```
JWT token_version  ==  DB token_version  →  session valid
JWT token_version  !=  DB token_version  →  session revoked, redirect to login
```

Deactivating a user in the admin panel increments their `token_version` — all their existing sessions (on all devices) are immediately invalidated without needing a token blacklist.

### Inviting new users

Admins invite users from `/utilisateurs/inviter`:

```
Admin fills: email + role + assigned countries
        ↓
System creates Supabase Auth account (temporary password)
        ↓
Generates a time-limited invite link (7-day JWT)
        ↓
Sends HTML email via Mailjet with the link
        ↓
New user clicks link → sets their permanent password → account activated
```

---

## Deployment

### Deploy to Vercel

The project is a standard Next.js application. Deployment to Vercel requires no special configuration.

**Step 1 — Push your code to GitHub**

```bash
git add .
git commit -m "ready for deployment"
git push origin main
```

**Step 2 — Import on Vercel**

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Vercel auto-detects Next.js — leave all build settings as default
4. Click **Deploy** (it will fail without env vars — that's expected)

**Step 3 — Add environment variables**

In Vercel → your project → **Settings → Environment Variables**, add all variables from the [Environment Variables](#environment-variables) section.

Set them for the **Production** environment (and Preview if needed):

| Variable | Required in Production |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |
| `JWT_SECRET` | Yes |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes |
| `MAILJET_API_KEY` | Yes (for invitations) |
| `MAILJET_API_SECRET` | Yes (for invitations) |
| `MAILJET_FROM_EMAIL` | Yes (for invitations) |
| `MAILJET_FROM_NAME` | Yes (for invitations) |

**Step 4 — Redeploy**

Go to **Deployments → Redeploy** (or push a new commit). The build should now succeed.

**Step 5 — Lock your Mapbox token**

In your Mapbox account → Tokens, add an **allowed URL** restriction for your Vercel domain (e.g. `https://id-bassin-congo.vercel.app`). This prevents others from using your token on their own sites.

---

### Supabase setup for production

**Create the GPX storage bucket**

```
Supabase Dashboard → Storage → New Bucket
  Name:   gpx-files
  Public: Yes  (files must be publicly accessible for EUDR analysis to download them)
```

**Disable Supabase email confirmation**

The platform has its own invite flow. Disable Supabase's default email confirmation to avoid conflicts:

```
Supabase Dashboard → Authentication → Settings → Email
  "Enable email confirmations" → OFF
```

**Add database indexes (recommended for production)**

For faster queries on large datasets, add indexes on the most-filtered columns:

```sql
CREATE INDEX IF NOT EXISTS idx_producteurs_pays_id     ON producteurs(pays_id);
CREATE INDEX IF NOT EXISTS idx_producteurs_created_by  ON producteurs(created_by);
CREATE INDEX IF NOT EXISTS idx_parcelles_pays_id       ON parcelles(pays_id);
CREATE INDEX IF NOT EXISTS idx_parcelles_created_by    ON parcelles(created_by);
CREATE INDEX IF NOT EXISTS idx_parcelles_status_eudr   ON parcelles(status_eudr);
CREATE INDEX IF NOT EXISTS idx_collectes_created_by    ON collectes(created_by);
CREATE INDEX IF NOT EXISTS idx_lots_created_by         ON lots(created_by);
```

**No direct PostgreSQL connection needed**

The app connects to Supabase via the JavaScript client and REST API. No `DATABASE_URL` or direct Postgres connection string is required.

---

### Custom domain (optional)

In Vercel → **Settings → Domains**, add your custom domain (e.g. `app.idbassin-congo.org`). Update your Mapbox token allowed URLs to include the new domain.

---

## Known Limitations

### EUDR Verification

- **Polygon required** — parcels with only a GPS point (no GPX/GeoJSON boundary) cannot be verified. They remain in `EN ATTENTE` status until a polygon is uploaded.
- **30m satellite resolution** — Hansen tiles are 30 meters per pixel. Parcels smaller than ~0.5 hectares may produce imprecise deforestation percentages.
- **No background job queue** — batch EUDR verification runs sequentially in a single API call. Verifying hundreds of parcels at once can hit Vercel's 60-second serverless function timeout.

### Access Control

- **Focal points cannot share data** — two agents covering the same country cannot see each other's records. If collaborative visibility is needed within a country, both agents must be promoted to admin.
- **Two roles only** — there is no "team lead" or "read-only" role. The next step for a more granular permissions model would be to add a role between `focal_point` and `admin`.

### Maps

- **Internet required** — Mapbox satellite tiles are fetched from the Mapbox CDN. The maps do not work offline.
- **Mapbox free tier** — the free plan allows 50,000 map loads per month. High-traffic deployments may need a paid plan.

### PDF Generation

- **No map image in DDS** — the generated PDF includes parcel data in table form but does not embed a satellite map image. Adding a map would require the Mapbox Static Images API or a headless browser.

### Email

- **No bounce detection** — if an invitation email bounces, there is no automatic alert. The admin must manually resend.
- **Local dev without email** — if Mailjet credentials are not set, invite emails are silently skipped. You can retrieve the invite token directly from the `user_profiles` table in Supabase for testing.

### Performance

- **Dashboard loads all stats on every visit** — 8+ parallel database queries run on every dashboard page load. For datasets with 10,000+ records, consider adding server-side caching or moving to incremental static regeneration.

---

*ID Bassin Congo — MVP Documentation · Last updated 2026-06-03*
