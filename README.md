# TenderRadar

Public procurement intelligence across Switzerland, EU, UK, and the US. Find tenders before your competition does.

## What it does

- **Feed** — browse active tenders from all connected sources, filterable by country, region, CPV code, keyword, deadline, and value
- **Matches** — tenders ranked by relevance to your company profile (CPV codes + keywords + region)
- **Tracker** — kanban board to manage your bid pipeline (New → Reviewing → Bid / No-Bid → Submitted)
- **Profile** — set your CPV codes, target regions, keywords, and contract size range

## Data Sources

| Source | Coverage | API Key | Sync endpoint |
|--------|----------|---------|---------------|
| [simap.ch](https://www.simap.ch) | Switzerland (all cantons) | No | `POST /api/sync` |
| [TED Europa](https://ted.europa.eu) | EU 27 + CH + NO + IS | No | `POST /api/sync/ted` |
| [Find a Tender](https://www.find-tender.service.gov.uk) | United Kingdom | No | `POST /api/sync/fts` |
| [SAM.gov](https://sam.gov) | US Federal | Yes (free, 1–4 days) | `POST /api/sync/sam` |

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Neon Postgres** (serverless, `@neondatabase/serverless`)
- **Tailwind CSS** (no component library)
- **simap.ch, TED Europa, Find a Tender, SAM.gov** REST APIs

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/unbrained-labs/tenderradar.git
cd tenderradar
pnpm install
```

### 2. Set up Neon

1. Create a free database at [console.neon.tech](https://console.neon.tech)
2. Copy the connection string

### 3. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local — at minimum set DATABASE_URL
```

### 4. Run migrations

```bash
pnpm db:migrate
```

Creates `tenders`, `profile`, `tracked_tenders`, and `sync_log` tables.

### 5. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## First Sync

The nav bar shows per-source sync buttons: **CH / EU / UK / US**.

Or hit the endpoints directly:

```bash
# Switzerland (simap.ch)
curl -X POST http://localhost:3000/api/sync

# EU (TED Europa)
curl -X POST http://localhost:3000/api/sync/ted

# UK (Find a Tender)
curl -X POST http://localhost:3000/api/sync/fts

# US (SAM.gov — requires SAM_GOV_API_KEY in .env.local)
curl -X POST http://localhost:3000/api/sync/sam
```

Each sync fetches the last 30 days of open tenders and upserts them into the `tenders` table.

---

## SAM.gov Setup

SAM.gov requires a free API key that takes 1–4 business days to activate:

1. Register your entity at [sam.gov](https://sam.gov/content/entity-registration)
2. Generate an API key in your account settings
3. Add to `.env.local`: `SAM_GOV_API_KEY=your_key_here`

Until the key is set, the US sync returns a 503 with instructions.

---

## Project Structure

```
app/
  page.tsx                  Feed (main tender list)
  tender/[id]/              Tender detail + Add to Tracker button
  matches/                  Profile-matched tenders with relevance scores
  tracker/                  Kanban board
  profile/                  Company profile setup
  api/
    sync/                   POST — sync simap.ch (Switzerland)
    sync/ted/               POST — sync TED Europa (EU)
    sync/fts/               POST — sync Find a Tender (UK)
    sync/sam/               POST — sync SAM.gov (US)
    tenders/                GET — list tenders with filters
    tenders/[id]/           GET — single tender
    profile/                GET + PUT — company profile
    tracker/                GET + POST — tracked tenders list
    tracker/[id]/           PATCH + DELETE — update/remove tracked tender

components/
  nav.tsx                   Sticky header with per-source sync buttons
  tender-card.tsx           Row/card variants for tender display
  tender-filters.tsx        Search + country/region/CPV/value filter panel
  deadline-badge.tsx        Deadline with urgency colouring
  cpv-badge.tsx             CPV code pill with label
  tracker-board.tsx         Drag-and-drop kanban board

lib/
  db.ts                     Neon database connection (lazy singleton + rawQuery helper)
  schema.sql                Full Postgres schema (run once via pnpm db:migrate)
  simap.ts                  simap.ch API client + normalizer
  ted.ts                    TED Europa API client + normalizer
  fts.ts                    Find a Tender (UK) API client + normalizer
  sam.ts                    SAM.gov API client + normalizer
  cantons.ts                Swiss canton data (26 cantons, with alpine subset)
  cpv-codes.ts              CPV code dictionary (~100 key codes across 16 divisions)
  types.ts                  Shared TypeScript types
  utils.ts                  Formatting helpers (dates, currency, etc.)
```

---

## Matching Logic

The Matches page scores tenders against your company profile:

| Signal | Weight |
|--------|--------|
| CPV division match (e.g. 45xx = construction) | +0.15 per match, capped at 0.50 |
| Region match (canton / country) | +0.30 |
| Keyword match in title or description | +0.05 per keyword, capped at 0.20 |

Results with score = 0 are not shown. Scores display as a percentage bar.

This is Level 1 matching. `RESEARCH.md` covers the roadmap to Level 3 (semantic embeddings with pgvector).

---

## Deployment

### Fly.io (recommended)

A `Dockerfile` and `fly.toml` are included. Default region is `cdg` (Paris — closest to Switzerland). Scales to zero when idle.

```bash
fly auth login
fly launch --no-deploy

fly secrets set DATABASE_URL="your-neon-connection-string"
fly secrets set CRON_SECRET="your-random-secret"
# If using SAM.gov:
fly secrets set SAM_GOV_API_KEY="your-sam-key"

fly deploy
```

Tail logs: `fly logs` | SSH: `fly ssh console`

### Cloudflare (as proxy in front of Fly.io)

Point your domain to the Fly.io app and enable the Cloudflare proxy (orange cloud). You get CDN, DDoS protection, and SSL with zero adapter complexity — no need to run on Cloudflare Workers.

---

## Roadmap

- [x] simap.ch integration (Switzerland)
- [x] TED Europa integration (EU 27 + CH)
- [x] Find a Tender integration (UK)
- [x] SAM.gov integration (US federal)
- [ ] Addenda/amendment detection (hash-based change tracking)
- [ ] Deadline email alerts (T-14, T-7, T-3)
- [ ] Multilingual search (DeepL translation of FR/IT/DE tender summaries)
- [ ] Semantic matching (pgvector embeddings)
- [ ] Austrian portal — auftrag.at
- [ ] Slack/webhook notifications
- [ ] Win/loss history for bid scoring

---

## API Notes

### simap.ch
- Base URL: `https://www.simap.ch/api`
- Two-step: search (`/publications/v2/project/project-search`) + detail (`/publications/v1/project/{id}/publication-details/{pubId}`)
- No API key needed. Tenders published in DE/FR/IT by issuing canton.

### TED Europa
- Base URL: `https://api.ted.europa.eu/v3`
- POST search with expert query syntax: `notice-type = cn-standard AND publication-date >= 20260101`
- No API key needed. Multilingual fields use ISO 639-2 language codes.

### Find a Tender (UK)
- Base URL: `https://www.find-tender.service.gov.uk/api/1.0`
- OCDS format, cursor-based pagination
- No API key needed.

### SAM.gov (US)
- Base URL: `https://api.sam.gov/opportunities/v2`
- Free API key required (1–4 day activation)
- Filters for `ptype=o,k` (solicitations + combined synopsis) and `active=Yes`
