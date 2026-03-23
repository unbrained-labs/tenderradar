# TenderRadar

Swiss public procurement intelligence. Find simap.ch tenders before your competition does.

## What it does

- **Feed** — browse all active tenders from simap.ch with full-text and CPV/canton filters
- **Matches** — tenders ranked by relevance to your company profile
- **Tracker** — kanban board to manage your bid pipeline (New → Reviewing → Bid/No-Bid → Submitted)
- **Profile** — set your CPV codes, cantons, keywords, and contract size range

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Neon Postgres** (serverless, `@neondatabase/serverless`)
- **Tailwind CSS** (no component library dependencies)
- **simap.ch REST API** (free, public)

---

## Setup

### 1. Clone and install

```bash
cd rfp-finder
pnpm install
```

### 2. Set up Neon

1. Create a free database at [console.neon.tech](https://console.neon.tech)
2. Copy the connection string

### 3. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local and fill in DATABASE_URL
```

### 4. Run migrations

```bash
pnpm db:migrate
```

This creates the `tenders`, `profile`, `tracked_tenders`, and `sync_log` tables.

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## First Run

### Verify the simap.ch API

The API client in `lib/simap.ts` is built on documented patterns, but field names
need to be verified against the live API before the first sync works correctly.

**Run this curl to see the real response shape:**

```bash
curl "https://www.simap.ch/api/publications/?page_size=3" | jq .
```

Compare the response to the `SimapPublication` interface in `lib/simap.ts`.
The most likely fields to need adjustment:

| Our field | Check this |
|---|---|
| `contracting_authority.name` | May be `authority_name` or `contracting_body.name` |
| `deadline_submission` | May be `submission_deadline` or `closing_date` |
| `estimated_value_from/to` | May be `estimated_value` as a single field |
| `cpv_codes` | May be `cpv_code` (singular) or an object `{code, label}` |
| `canton` | May be `place_of_performance` or inside the authority object |

The `normalizeTender()` function in `lib/simap.ts` handles the transformation.
Edit it to match the real API shape.

### Trigger a sync

Click **Sync** in the nav bar, or hit the endpoint directly:

```bash
curl -X POST http://localhost:3000/api/sync
```

The first sync fetches the last 30 days of publications. Subsequent syncs
fetch only since the last successful sync.

---

## Project Structure

```
app/
  page.tsx              Feed (main tender list)
  tender/[id]/          Tender detail + Add to Tracker button
  matches/              Profile-matched tenders with relevance scores
  tracker/              Kanban board
  profile/              Company profile setup
  api/
    sync/               POST — fetch from simap.ch, upsert to DB
    tenders/            GET — list tenders with filters
    tenders/[id]/       GET — single tender
    profile/            GET + PUT — company profile
    tracker/            GET + POST — tracked tenders list
    tracker/[id]/       PATCH + DELETE — update/remove tracked tender

components/
  nav.tsx               Sticky header with nav + sync button
  tender-card.tsx       Row and card variants for tender display
  tender-filters.tsx    Search + canton/CPV/value filter panel
  deadline-badge.tsx    Deadline with urgency colouring
  cpv-badge.tsx         CPV code pill with label
  tracker-board.tsx     Drag-and-drop kanban board

lib/
  db.ts                 Neon database connection
  schema.sql            Full Postgres schema (run once)
  simap.ts              simap.ch API client + normalizer
  cantons.ts            Swiss canton data (26 cantons)
  cpv-codes.ts          CPV code dictionary (~100 key codes)
  types.ts              Shared TypeScript types
  utils.ts              Formatting helpers (dates, currency, etc.)
```

---

## Matching Logic

The Matches page uses a simple scoring model:

| Signal | Weight |
|---|---|
| CPV division match (e.g., 45xx for construction) | +0.15 per match, capped at 0.50 |
| Canton match | +0.30 |
| Keyword match in title/description | +0.05 per keyword, capped at 0.20 |

Results with score = 0 are not shown. Scores are displayed as a percentage bar.

This is Level 1 matching (keywords + codes). The research doc (RESEARCH.md)
describes the roadmap to Level 3 (semantic embeddings with pgvector).

---

## Adding More Data Sources

To add TED Europa (EU procurement, free):

1. Register for a free EU Login API key at [api.ted.europa.eu](https://api.ted.europa.eu)
2. Create `lib/ted.ts` following the same pattern as `lib/simap.ts`
3. Add a `/api/sync/ted` route
4. The canonical schema already handles multi-source tenders (the `source` field)

To add SAM.gov (US federal, free):

1. Register at [sam.gov](https://sam.gov) for an API key (takes 1-4 weeks)
2. API docs: [open.gsa.gov/api/get-opportunities-public-api](https://open.gsa.gov/api/get-opportunities-public-api/)
3. Create `lib/sam.ts` + `/api/sync/sam`

---

## Deployment

### Fly.io (recommended)

A `Dockerfile` and `fly.toml` are included.

```bash
# Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
fly auth login

# First deploy — picks up fly.toml, creates the app
fly launch --no-deploy

# Set secrets (never commit these)
fly secrets set DATABASE_URL="your-neon-connection-string"
fly secrets set CRON_SECRET="your-random-secret"

# Deploy
fly deploy
```

The app runs in Paris (`cdg`) by default — closest region to Switzerland.
Scales to zero when idle, spins up on request (cold start ~1s).

To tail logs: `fly logs`
To SSH in: `fly ssh console`

### Cloudflare Pages

Cloudflare Pages supports Next.js via the `@cloudflare/next-on-pages` adapter,
but it runs in the **edge runtime** which has restrictions:
- No Node.js built-ins (some Neon operations may need polyfills)
- Neon's `@neondatabase/serverless` works fine on edge (it uses `fetch` under the hood)

```bash
pnpm add -D @cloudflare/next-on-pages wrangler

# Add to next.config.mjs:
# import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev'

# Build for Cloudflare
pnpm exec next-on-pages

# Deploy
wrangler pages deploy .vercel/output/static
```

Set `DATABASE_URL` and `CRON_SECRET` in the Cloudflare Pages dashboard
under Settings → Environment Variables.

> **Simpler option**: use Cloudflare as your DNS/proxy in front of Fly.io.
> Point your domain to the Fly.io app, enable the Cloudflare proxy (orange cloud).
> You get Cloudflare's CDN, DDoS protection, and SSL for free with zero adapter complexity.

---

## Roadmap (from RESEARCH.md)

- [ ] TED Europa integration (EU + Swiss above-threshold tenders)
- [ ] Addenda/amendment detection (hash-based change tracking)
- [ ] Deadline email alerts (T-14, T-7, T-3)
- [ ] Multilingual search (DeepL translation of FR/IT tender summaries)
- [ ] Semantic matching (pgvector embeddings)
- [ ] Austrian portal integration (auftrag.at)
- [ ] SAM.gov integration (US federal)
- [ ] Slack/webhook notifications
- [ ] Win/loss history for bid scoring

---

## simap.ch API Notes

- Base URL: `https://www.simap.ch/api`
- Spec changelog: `https://www.simap.ch/api/specifications/changelog.html`
- No API key needed for public publication data
- Rate limit: generous for unauthenticated access; register for higher limits
- Tenders published in DE/FR/IT depending on issuing canton
