# RFP Finder — Research Document
**Status:** Research Phase
**Last Updated:** 2026-03-18
**Purpose:** Pre-build research to understand the market, existing tools, data sources, and architecture decisions before writing a single line of code.

---

## Table of Contents

1. [Vision and Premise](#1-vision-and-premise)
2. [Market Landscape — Who Exists and What They Do](#2-market-landscape)
3. [Where the Market Fails — The Real Gaps](#3-where-the-market-fails)
4. [Data Sources by Region](#4-data-sources-by-region)
   - 4.1 United States
   - 4.2 Switzerland
   - 4.3 DACH Region (Germany, Austria, Liechtenstein)
   - 4.4 European Union (TED as backbone)
   - 4.5 International
5. [Two Use Cases in Depth](#5-two-use-cases-in-depth)
   - 5.1 Swiss OT/SCADA Dev Studio
   - 5.2 Alpine Specialist Construction Firm
6. [The Canonical Data Model](#6-the-canonical-data-model)
7. [Geographic and Language Architecture](#7-geographic-and-language-architecture)
8. [Matching and Relevance Logic](#8-matching-and-relevance-logic)
9. [Notification and Workflow Design](#9-notification-and-workflow-design)
10. [Technical Architecture](#10-technical-architecture)
11. [Open Questions — Things We Don't Know Yet](#11-open-questions)
12. [What "Better Than Anyone" Actually Means](#12-what-better-than-anyone-means)
13. [Appendix — CPV Codes Reference](#appendix)

---

## 1. Vision and Premise

### The Core Problem

Every organization that competes for work — a dev studio, a construction firm, a consulting agency, a law firm — spends enormous energy just *finding* opportunities. The work exists. It's often public. But it's buried across hundreds of portals, published in multiple languages, tagged with classification codes most people don't know, and expires while the potential bidder is still discovering it.

The tools that solve this today are either:
- **Too expensive** (GovWin IQ: $13K–$119K/year)
- **Too narrow** (federal-US-only, construction-only, nonprofit-only)
- **Too dumb** (keyword matching from 2005)
- **Wrong product** (Loopio, Responsive, Arphie are RFP *response* tools — they help you answer an RFP you already have, not find new ones)

### The Premise

A modern, well-architected RFP discovery platform should be:
- **Generic by design** — any industry, any company type, any size
- **Regional by configuration** — search within a country, a canton, a region, or globally
- **Smart by default** — not just keyword matching; semantic understanding of what a company actually does
- **Affordable** — under $100/month for a small firm, not $30,000/year
- **Multilingual** — especially for Switzerland (German, French, Italian) and DACH
- **Open-source-first where possible** — free data sources before paid APIs

### What This Is Not

- Not an RFP *response* tool (we're not competing with Loopio or Arphie)
- Not a procurement management system for buyers (not competing with Ariba or Jaggaer)
- Not a grants-only platform (though grants are included as a notice type)

---

## 2. Market Landscape

### 2.1 Enterprise Procurement Intelligence

These tools focus on US government contracting (GovCon) pipeline intelligence. They are the most mature tools but least relevant to non-US or non-government use cases.

#### GovWin IQ (Deltek)
- **What it does**: Tracks *pre-solicitation* intelligence — program plans, incumbent contracts expiring, agency spending forecasts, teaming partners. The value is knowing about a contract before it's formally RFP'd.
- **Pricing**: $15,000–$119,000/year. Average deal ~$29,000.
- **Who uses it**: US GovCon BD teams, large defense/IT contractors.
- **UX reality (from user reviews)**: Functional but dated. Hard to run compound searches. Navigation is criticized consistently. Learning curve for new users.
- **Data quality complaints**: Opportunities are often unverified, links broken, details incomplete. Not frequently enough updated.
- **Decisive weakness**: US-only. No DACH, no EU, no international data. Expensive for small businesses. Overkill for non-GovCon.
- **What they do well**: Pre-solicitation intelligence (early warning before RFP is posted) is genuinely valuable and has no equivalent in the open market.

#### GovSpend
- Mid-market. Primarily spend analytics (what agencies have bought before), not opportunity discovery. Salesforce/HubSpot push for CRM workflows. Better as a complement to discovery than as discovery itself.

---

### 2.2 RFP Response Management Tools (Different Category)

These tools are frequently confused with discovery tools. They are fundamentally different. You bring them an RFP you already have; they help you respond to it efficiently.

#### Responsive (formerly RFPIO)
- Market leader for 24+ consecutive quarters (G2).
- **What it does**: Maintains a Q&A content library, routes questions to SMEs, AI drafts responses, manages submission workflow. 2,000+ customers, $500B+ in opportunities processed.
- **UX problems (from G2/Capterra)**:
  - Steep learning curve; requires significant change management
  - Search misidentifies queries — "constantly shows unrelated results"
  - Content disappears due to unreliable auto-save (documented incidents)
  - Import issues — answers mapped to wrong cells in Excel exports
  - Poor Microsoft Word support for narrative proposals
  - Every reviewer needs a paid seat — no free occasional-user tier
- **Pricing**: Opaque, enterprise-only. Recent change to per-10-user blocks drew complaints.

#### Loopio
- #1 on UX among enterprise RFP response tools (4.8/5 G2).
- **What it does**: Same category as Responsive. Differentiates on ease of use and customer success.
- **UX problems (from reviews)**:
  - AI features ("Magic AI") underwhelm vs. newer competitors
  - Content becomes stale fast without dedicated library maintenance
  - Export creates downstream formatting work
  - Long-form narrative proposals are a weakness
- **Pricing**: $1,500–$35,400/year. Annual price increases of 8–12% reported.
- **Reddit take**: "Without ownership of the library, it's just as useful as a dump of questions in Confluence."

#### Arphie
- AI-native (founded 2023). Patent-pending "chunking" technology.
- **Claims**: 84% AI answer acceptance rate (from customer data). Saves ~19 hours per RFP.
- **Weakness**: Short track record, limited import formats, no public pricing, analytics still developing.
- **Why it matters**: Demonstrates the direction — AI-first, not bolt-on AI. Will likely displace legacy tools.

**Bottom line on response tools**: These are important context for what *not* to build. The market is crowded, expensive, and user-hostile. A discovery tool that feeds into an AI-assisted response layer would be powerful — but build discovery first.

---

### 2.3 Vertical Construction Bid Tools

#### ConstructConnect
- Largest private construction bid network in the US. 100,000+ bidders, 1.4M active projects.
- **User reviews**: "Completely unreliable." Trades not consistently mapped to standard CSI codes. Data quality issues from self-maintained profiles. Generic "spray and pray" approach to ITBs.
- **Pricing**: $3,600+/year. "Costs vary wildly."

#### BuildingConnected (Autodesk)
- GC-to-subcontractor bid management. Now part of Autodesk Construction Cloud.
- Strengths: large subcontractor network, clean UX.
- Weakness: mobile experience poor; subs must self-maintain profiles; doesn't cover public procurement.

#### PlanetBids
- Government agency-facing procurement system. Critical flaw: **no shared vendor database**. A contractor registered with 30 agencies spends 4–6 hours per quarter just on account maintenance. 73% of contractors using PlanetBids miss at least 2 opportunities per month from portal management overhead (AGC 2025 survey).

#### QuestCDN
- Municipal public works bid management for government project owners. Not a discovery tool.

#### TenderLift (Switzerland-specific)
- AI-powered Swiss construction tender monitoring. Filters by CPV code + canton. Extracts eligibility requirements, insurance thresholds, and deadlines.
- **Current limitation**: Coverage focused on Ticino, expanding to Zürich then Romandie.
- **Relevance**: Closest competitor for the Swiss market. Shows feasibility and demand. Weakness is limited geographic coverage and single-vertical focus.

---

### 2.4 European Aggregators

#### Patterno
- Aggregates 1,000+ European procurement portals.
- AI-powered matching with industry modules.
- €99/month. Daily relevance reports.
- 26 language versions.
- **Weakness**: No deep profile matching, no workflow tools, primarily a feed service.

#### DTAD
- German market specialist. 20+ years.
- Keyword-based search. No AI.
- Paid service, pricing undisclosed.
- No Swiss/French/Italian support noted.

#### Tenderbot
- Smart normalization of multi-lingual tender fields.
- Continuous daily data ingestion from EU portals.
- Smaller/less documented than Patterno.

**Key observation**: European aggregators are either very old and dumb (DTAD) or newer but shallow (Patterno). None offer deep company profile matching, semantic relevance, or workflow tools. This is the gap.

---

### 2.5 Enterprise Procurement Platforms (Buyer Side — Context Only)

These platforms are used by *buyers* to run procurement. Understanding them helps because your users may be submitting via these platforms.

| Platform | Used By | Key Note |
|---|---|---|
| **SAP Ariba** | Large corporations, SBB, Swissgrid | Dominant in CH/EU enterprise. Invitation-only — suppliers can't discover buyers. Complex for small vendors. |
| **Coupa** | Enterprise | Supplier portal + discovery, but buyer-initiated only. AI enhanced in March 2026. |
| **Ivalua** | Enterprise | Source-to-pay suite. No mobile app. Customization expensive. |
| **Jaggaer** | Manufacturing, life sciences, universities | Strong in direct procurement. Limited flexibility for unique processes. |
| **Procore** | Construction GCs | Bid management module for GC→sub invitations. Private sector only. |

**Implication for our platform**: We should be aware of which platforms issuers use — because the full tender documents and submission portals will vary. Our tool discovers the opportunity; the user submits via the issuer's chosen platform.

---

## 3. Where the Market Fails

These are the genuine, researchable gaps — not assumptions.

### Gap 1: No Affordable Discovery Tool for SMEs
The price cliff is real. GovWin: $15K+. Patterno: €99/month with limited intelligence. Nothing in between offers semantic matching + workflow + multi-region coverage at a price a 5-person studio can afford.

### Gap 2: No Cross-Sector, Cross-Region Tool
Every tool is either US-only, construction-only, nonprofit-grants-only, or EU-only. A Swiss dev studio doing OT work and a Swiss alpine construction firm cannot be served by the same tool today. They should be.

### Gap 3: No Semantic Matching
Current tools match on NAICS/NIGP/CPV codes + keywords. This fails in two ways:
- Many RFPs are miscoded (wrong NAICS code applied by the issuing authority)
- Keywords miss synonyms, related capabilities, and adjacent work

A company that builds SCADA dashboards for energy utilities won't find an RFP asking for "Leitsystemmodernisierung" (control system modernization) unless they're searching in German with the right CPV code. Semantic embeddings solve this.

### Gap 4: No Multilingual Swiss Coverage
Switzerland publishes tenders in German, French, and Italian. No free tool normalizes across all three languages into a single searchable interface with intelligent matching. TenderLift does this for construction in Ticino (Italian). Nobody does it comprehensively for all sectors and all language regions.

### Gap 5: Below-Threshold Opportunities Are Dark
In Switzerland, direct award is permitted below CHF 150,000 and invitation procedure below CHF 250,000. These opportunities never appear on simap.ch. For construction firms doing maintenance contracts and specialist work, this is a structural blind spot. No digital tool can fully solve this — but building relationships, monitoring cantonal budgets, and tracking known procurement patterns can partially address it.

### Gap 6: Private Sector RFPs Are Scattered
Private companies (not subject to procurement law) issue RFPs but they appear nowhere central. LinkedIn posts, direct emails, industry associations, platform-specific portals. This remains an unsolved aggregation problem. For a first version, focus on public procurement where data is structured and freely available.

### Gap 7: Addenda Are Ignored
RFPs are living documents. Deadlines extend. Scope changes. Documents get replaced. Most discovery tools find the initial posting and stop. Missing an addendum means submitting based on outdated information — a disqualifying mistake. Almost no discovery tool tracks post-publication changes and alerts the tracking user.

---

## 4. Data Sources by Region

### 4.1 United States

#### SAM.gov (Federal)
- **What it covers**: All US federal contracts above the micro-purchase threshold ($10K). The single mandatory publication platform for federal procurement.
- **Volume**: ~500–2,000 new opportunities per day.
- **API**: Fully documented REST API at `https://api.sam.gov/prod/opportunities/v2/search`
- **Rate limits**:
  - Public (no key): 10 requests/day — not usable for production
  - Registered entity (free API key): 1,000 requests/day — sufficient for daily polling
  - Federal system account: 10,000/day
- **Registration**: API key via SAM.gov profile. Takes **1–4 weeks** to process. Register immediately if building this.
- **Notice types**: Presolicitation, Sources Sought, Combined Synopsis/Solicitation, Award Notices, Justification, Special Notice, Sale of Surplus.
- **Key fields**: `noticeid`, `solicitationNumber`, `title`, `type`, `postedDate`, `responseDeadLine`, `naicsCode`, `classificationCode` (PSC), `setAside`, agency, place of performance, estimated value.
- **FPDS transition**: Legacy FPDS.gov ATOM feed retiring FY2026. All contract award data migrating to SAM.gov API. Build exclusively against SAM.gov API.
- **Coverage**: Federal only — ~$700B+ annual contract volume.

#### Grants.gov (Federal Grants)
- Separate from SAM.gov. All federal grant opportunities.
- Free public API + RSS feeds.
- Relevant for nonprofits, research institutions, some innovation programs.

#### State and Local
The US state/local tier is deeply fragmented. Key aggregators:

| Platform | Coverage | Cost | Access |
|---|---|---|---|
| BidNet Direct | 40,000+ state/local agencies | Subscription (geo-tiered) | NIGP code-based alerts |
| DemandStar | Municipal focus | Free ($25/yr) | Public browse at `demandstar.com/browse-bids` |
| Periscope S2G | Multi-state public listings | Free tier + paid | Aggregator; pulls public listings |

**Raw state portals**: Each state has a dedicated procurement site (Texas SmartBuy, Cal eProcure, NY Contract Reporter, etc.). Publicly accessible but require individual scrapers. NASPO maintains a directory.

**Scraping feasibility**: Most US state portals are HTML-rendered and publicly browsable. Legal risk is low (government data is public domain) but ToS varies. Playwright/Scrapy stack handles the majority.

---

### 4.2 Switzerland

#### simap.ch — The Swiss Source of Truth
- **What it covers**: ALL Swiss public procurement above threshold — federal, cantonal, communal, and public enterprises (SBB, Swissgrid, Swisscom, Post, etc.).
- **Legal basis**: The revised Public Procurement Act (BöB/LMP) in force since January 2021 mandates publication on simap.ch for all entities subject to the law.
- **Annual volume**: ~CHF 20 billion in public procurement flows through it.
- **Platform history**: Substantially redesigned and relaunched **July 2024** (replacing a very old legacy system). February 2025 update added further features.
- **Thresholds**:
  - Direct award: up to CHF 150,000
  - Invitation procedure: CHF 150,000–250,000
  - Open/selective procedure (must publish on simap.ch): CHF 250,000+
- **API**: Confirmed REST API at `https://www.simap.ch/api/` (v1.5.1 as of research). Endpoints: `/publications/`, `/vendors/`, `/procoffices/`, `/subscriptions/`, `/statistics/`. Unauthenticated access gives public publication data; authenticated access adds vendor-specific features. JSON responses. **This is the primary data source for Switzerland.**
- **Language handling**: Tenders published in the language of the issuing authority. German (Zurich, Bern), French (Geneva, Lausanne), Italian (Ticino). Interface has multi-language UI but tender documents are not auto-translated.
- **Alerts**: Free keyword + CPV code + canton subscription alerts. Currently free; platform notes this "may in future incur a fee."
- **TED republication**: Above-threshold Swiss tenders are also republished on TED (Tenders Electronic Daily) under Decision 2002/309/EC. Switzerland is included in TED despite not being EU/EEA. Monitoring both simap.ch + TED gives comprehensive coverage of above-threshold Swiss procurement.
- **Mobile app**: iOS app available (App Store ID 1017239229).

#### Key Swiss Public Entities That Tender OT/Tech Work
- **Swissgrid**: National grid operator. Subject to PPA/PPO. Publishes on SIMAP; uses SAP Ariba for supplier interaction. CHF 5.5B investment programme to 2040 (~CHF 350–400M/year). Examples: substation replacement (Leibstadt October 2025), SCADA security upgrades.
- **SBB (Swiss Federal Railways)**: Subject to PPA/PPO. Publishes on SIMAP; uses SAP Ariba. Publishes semi-annual procurement forecasts as Excel files. Railway control systems, ETCS, interlocking, traction power SCADA, IT infrastructure.
- **Cantonal utilities** (Elektrizitätswerke, Wasserversorgungen): Above-threshold work published on SIMAP under cantonal procurement law.
- **ASTRA** (Federal Roads Office): Road tunnel control systems, traffic management, monitoring infrastructure.
- **ETH / EPFL / University hospitals**: Research infrastructure procurement, lab automation, building automation.

#### Swiss Thresholds (Simplified)
| Procurement Type | Direct Award | Invitation | Open/Selective (simap.ch) |
|---|---|---|---|
| Supplies/Services | Up to CHF 150K | CHF 150K–250K | Above CHF 250K |
| Construction works | Up to CHF 300K | CHF 300K–2M | Above CHF 2M |

**Critical implication**: A significant portion of specialist construction work (maintenance contracts, small alpine works) falls below the CHF 300K threshold and is awarded directly or via private invitation. This work is **not on simap.ch and never will be**. The platform can only solve the above-threshold portion unless we build a private-sector discovery layer.

#### Third-Party Swiss Aggregators (Competitive Landscape)
- **TenderLift** (tenderlift.ch): AI-powered, construction focus, CPV + canton filtering, eligibility extraction. Currently Ticino → expanding. Free 14-day trial.
- **konkurado.ch**: Swiss tender aggregator with monitoring alerts. Less AI-focused.
- **competitions.espazium.ch**: Architecture and landscape architecture competitions only.

---

### 4.3 DACH Region

#### Germany — The Fragmentation Problem
Germany is the hardest DACH market. The structural challenge: **180+ separate procurement portals** for a single country. This is a political/federalism artifact — each state, many municipalities, and many public entities run their own platforms.

**Key portals**:

| Portal | Coverage | Notes |
|---|---|---|
| **DTVP** (dtvp.de) | Largest nationwide; Bundesanzeiger Verlag + cosinex | 25,000+ cross-portal notices daily; mentions "open interfaces" but no public API docs confirmed |
| **Subreport ELViS** | Municipal focus; one of oldest platforms | Free document download without registration — valuable for scraping |
| **Deutsche eVergabe** | Healy Hudson platform family | Covers multiple individual systems |
| **Vergabe24** | Baden-Württemberg, Hesse, Rhineland-Palatinate, Saarland | Staatsanzeiger platform; strong southern Germany |
| **Vergabe.NRW** | North Rhine-Westphalia | State-run |

**TED coverage**: All *above-threshold* German contracts also appear on TED. For practical purposes, TED is the primary free data source for above-threshold German public procurement. Sub-threshold requires either individual portal scraping or a paid aggregator.

**Paid aggregators for Germany**:
- **Patterno**: €99/month, 1,000+ EU portals, AI matching, 26 languages.
- **DTAD**: 20+ years, keyword-only, paid.

#### Austria
- **auftrag.at**: Primary federal and federal-sector publication portal. Free to search. CPV code + NUTS code filtering.
- **USP Ausschreibungssuche**: Business service portal unified search. Free, no registration.
- **Nine provincial databases**: Each Bundesland has a separate database.
- **TED**: All above-threshold Austrian contracts on TED.
- **API status**: No public API documented for auftrag.at. Email notification and search profiles available.

#### Liechtenstein
- Member of WTO Government Procurement Agreement; EEA procurement rules via EEA membership.
- Above-threshold tenders appear on TED (NUTS code LI).
- Portal: llv.li (National Administration). Free to view.
- Volume: Very low — micro-state, population ~40,000.
- Practical approach: Monitor TED with LI country filter; sufficient coverage.

---

### 4.4 European Union — TED as the Backbone

**Tenders Electronic Daily (ted.europa.eu)** is the most important single data source for any European-focused RFP platform.

**Coverage**:
- All 27 EU member states
- EEA members: Norway, Iceland, Liechtenstein
- **Switzerland** (under Decision 2002/309/EC)
- EU candidate countries
- EU institutions themselves
- Note: UK stopped publishing on TED January 1, 2021 (post-Brexit)

**Volume**: ~800,000 procurement notices per year. Above-threshold only (thresholds set by EU directives: ~€215K for services, ~€5.4M for construction as of 2024).

**Free access**: Yes — full, unlimited access for searching, reading, and downloading.

**API access options**:
1. **TED API v3** (`api.ted.europa.eu`): REST API with 6 families — Publication, Validation, Visualisation, Search, Conversion, Developer Operations. Requires EU Login (free registration).
2. **Bulk XML download**: Daily editions as XML packages. Available since January 2011. FTP at `ftp://ted.europa.eu` with credentials `guest/guest` since 1993. This is the most practical option for large-scale ingestion.
3. **TED Open Data Service** (`data.ted.europa.eu`): SPARQL endpoint for Linked Open Data.
4. **GitHub**: Publications Office maintains open-source tools at `github.com/OP-TED`.

**Language behavior**: TED publishes eForms summary fields in all 24 EU official languages + Icelandic + Norwegian. But full tender documents are in the national/regional language. For Swiss tenders: German, French, or Italian depending on issuing canton.

**Classification on TED**: Uses CPV codes natively. This is the universal filter across all European procurement.

**Strategic priority**: TED bulk XML download is the most efficient way to ingest large volumes of above-threshold EU + Swiss tenders. Combined with simap.ch API for Swiss-specific tenders (including those below EU threshold but above Swiss threshold), you have comprehensive Swiss public procurement coverage.

---

### 4.5 International

| Region | Portal | Access | Notes |
|---|---|---|---|
| Canada | CanadaBuys | Limited API; SAP Ariba-based | MERX is de facto aggregator (paid) |
| Australia | AusTender | Free CSV/XML bulk download | No real-time API |
| New Zealand | GETS | Browse only | No public API |
| UK | Find a Tender (FTS) | Free; replaced TED post-Brexit | REST API available |
| USA | SAM.gov | Free API (see above) | Primary US source |

**For V1**: Focus on Switzerland + DACH + EU TED. International expansion (US, UK, Canada, Australia) is a later phase.

---

## 5. Two Use Cases in Depth

### 5.1 Use Case: Swiss OT/SCADA Dev Studio

**Profile**: Small software development studio in Switzerland. Specializes in operational technology — SCADA systems, industrial control interfaces, building management systems (BMS), energy management software. 5–15 people. Looking for project work with Swiss public entities and private industrial companies.

**What OT procurement looks like**:
- Modernization of SCADA systems at cantonal utilities
- Control system cybersecurity assessments and upgrades
- Building automation (Gebäudeautomation) for hospitals, universities, large public buildings
- Railway control system components (SBB ecosystem)
- Energy grid monitoring software (Swissgrid ecosystem)
- Industry 4.0 integration projects with private manufacturers

**Where these appear**:
- **simap.ch**: Above CHF 250K service contracts from public entities (Swissgrid, SBB, cantonal utilities, Eidgenössische Betriebe, hospitals).
- **TED**: Swiss tenders above EU threshold that are also published on TED.
- **Private sector**: Not on any public portal. Issued directly by industrial companies, often via SAP Ariba (for companies that use it) or direct outreach.
- **GlobalTenders.com confirms**: ~95 live notices for industrial automation in Switzerland at any given time (cantonal governments, transport authorities, educational facilities, healthcare).

**NIS2 / Swiss ISA relevance**: The Swiss Information Security Act (ISA), in force since January 2024, mandates:
- Critical infrastructure operators report cyberattacks to BACS within 24 hours (from April 2025)
- Contracting authorities can **exclude tenderers that fail to patch software vulnerabilities** within BACS deadlines (direct procurement exclusion criterion)
- Scope: energy, finance, healthcare, insurance, transport, communications, IT

**Implication**: ISA compliance is a procurement driver. Swiss public entities in critical sectors are being forced to upgrade OT security. This creates a **procurement wave** of SCADA security assessments, system upgrades, and monitoring tool implementations — all appearing on simap.ch.

**CPV codes most relevant to this use case**:
- `72200000` – Software programming and consultancy services
- `72211000` – Programming services of systems and user software
- `72310000` – Data processing services
- `72500000` – Computer-related services
- `51100000` – Installation services of electrical and mechanical equipment
- `72720000` – Wide area network services (for OT network infrastructure)
- `35120000` – Surveillance and security systems (for OT monitoring)
- `31682500` – Emergency power supply equipment (includes control systems)

**What this studio needs from the platform**:
1. Alerts for new simap.ch publications matching OT/SCADA CPV codes in German, French, and Italian
2. Full tender document download links
3. Pre-screened eligibility check (are they too small? do they need certifications?)
4. Deadline tracking with reminders at T-14 and T-7
5. History of similar awards (to understand typical contract values and winners)
6. Private sector discovery — this is a gap the platform cannot fully solve in V1

---

### 5.2 Use Case: Alpine Specialist Construction Firm

**Profile**: Highly specialized construction company operating in alpine terrain. Work that others might call extreme: avalanche protection structures, mountain road stabilization, steep terrain access works, retaining wall systems in high-altitude environments, rope access construction, post-natural-disaster restoration. Operating in Switzerland (primarily), possibly extending to Austria and northern Italy. 20–50 people.

**What alpine specialist procurement looks like**:

| Work Type | Who Issues It | Typical Value | Portal |
|---|---|---|---|
| Avalanche protection (Lawinenschutz) | ASTRA, cantonal road authorities, Tiefbauämter | CHF 500K–5M | simap.ch |
| Snow support structure installation/maintenance | ASTRA, Amt für Wald und Naturgefahren | CHF 200K–2M | simap.ch |
| Mountain road construction and stabilization | Cantonal road authorities | CHF 300K–10M+ | simap.ch |
| Tunnel construction (small tunnels/galleries) | ASTRA, SBB, cantonal entities | CHF 1M–100M+ | simap.ch + TED |
| Slope stabilization / rockfall protection | ASTRA, cantonal authorities, private infrastructure owners | Varies widely | simap.ch (public) or direct (private) |
| Cable car infrastructure | Public Bergbahnen | CHF 500K–5M | simap.ch (if municipal/cantonal owner) |
| Post-landslide restoration | Cantonal civil protection | Emergency: direct. Non-emergency: simap.ch |
| Hydropower infrastructure in alpine terrain | Cantonal utilities, EWZ, Kraftwerke | CHF 1M–50M+ | simap.ch + TED |

**CPV codes most relevant to alpine construction**:
- `45220000` – Engineering works and construction
- `45221000` – Engineering works for bridges and tunnels
- `45221200` – Tunnel construction works
- `45233100` – Construction works for highways, roads
- `45240000` – Hydraulic engineering construction (hydropower, water management)
- `45262620` – Erection of retaining structures
- `45112500` – Earthmoving and excavation
- `45112700` – Land restoration and reclamation work
- `71311000` – Civil engineering consultancy services
- `45340000` – Fencing, railing and safety equipment installation (includes rockfall barriers)

**The below-threshold problem**:
The fundamental challenge for this use case: many maintenance contracts and smaller remediation works fall **below CHF 300,000** (Swiss construction open tender threshold). These are awarded:
- Via direct award to known contractors (below CHF 300K)
- Via private invitation to 3–5 known firms (CHF 300K–2M)

These opportunities are **invisible** to any procurement portal. They circulate via:
- Long-term relationships with cantonal engineers
- Trade associations (SBV — Schweizerischer Baumeisterverband, ASIH for alpine hazard work)
- Proximity — cantonal authorities often invite local firms they know

**Geographic targeting**:
- Primary focus: Alpine cantons — Graubünden (GR), Valais/Wallis (VS), Bern (BE, alpine sections), Uri (UR), Schwyz (SZ), Glarus (GL), Obwalden/Nidwalden (OW/NW), Appenzell (AI/AR for alpine zones).
- Secondary: Northern Italy (Trentino-Alto Adige, Aosta Valley) — covered by TED and national Italian portal (acquistinrete.it).
- Tertiary: Austria (Vorarlberg, Tyrol, Salzburg, Carinthia) — covered by auftrag.at + TED.

**What this firm needs from the platform**:
1. Canton-level filtering (Graubünden, Valais, Bern, etc.) for simap.ch publications
2. CPV code filtering for construction + civil engineering + natural hazard work
3. Multi-language: German tenders from German-speaking cantons, French from Valais (bilingual), Italian from Ticino/Graubünden (Italian areas)
4. Value range filter (they probably don't bid below CHF 300K or above CHF 20M)
5. Deadline reminders with longer lead times (construction bids take longer to prepare)
6. History of similar awards in their target cantons (competitor intelligence)
7. **Important**: Austrian and Italian alpine region coverage for cross-border work

---

## 6. The Canonical Data Model

A single schema must normalize RFPs from simap.ch, TED, SAM.gov, Austrian portals, and German portals. This is the most important architectural decision — everything else builds on it.

```json
{
  // Identity
  "id": "uuid",
  "source_id": "SIMAP-2024-123456",
  "source": "simap.ch | ted.europa.eu | sam.gov | auftrag.at | ...",
  "source_url": "https://...",
  "canonical_url": "https://...",

  // Core content
  "title": "Erneuerung Lawinenschutzgalerie, Kantonsstrasse K10",
  "title_translations": {
    "de": "...",
    "fr": "...",
    "it": "...",
    "en": "..."
  },
  "description": "full text of notice",
  "description_translations": { ... },

  // Issuer
  "issuer_name": "Kanton Graubünden, Tiefbauamt",
  "issuer_type": "cantonal | federal | municipal | public_enterprise | private | international_org",
  "issuer_country": "CH",
  "issuer_nuts_region": "CH056",
  "issuer_canton": "GR",
  "issuer_city": "Chur",

  // Notice metadata
  "notice_type": "rfp | rfq | rfi | sources_sought | presolicitation | grant | award | framework | dynamic_purchasing",
  "procedure_type": "open | restricted | negotiated | direct | competitive_dialogue",
  "solicitation_number": "2024/123456",
  "lot_number": null,

  // Dates
  "posted_date": "2024-11-15T00:00:00Z",
  "response_deadline": "2024-12-20T12:00:00Z",
  "qa_deadline": "2024-12-01T12:00:00Z",
  "estimated_start_date": "2025-03-01",
  "estimated_end_date": "2025-11-30",

  // Value
  "estimated_value_min": 500000,
  "estimated_value_max": 2000000,
  "estimated_value_currency": "CHF",
  "estimated_value_notes": "CHF 500,000–2,000,000 depending on scope",

  // Classification
  "cpv_codes": ["45221200", "45262620"],
  "cpv_labels": ["Tunnel construction works", "Erection of retaining structures"],
  "naics_codes": [],
  "nigp_codes": [],
  "custom_categories": ["alpine_construction", "civil_engineering", "natural_hazard"],

  // Geography
  "place_of_performance_country": "CH",
  "place_of_performance_region": "Graubünden",
  "place_of_performance_city": "Thusis",
  "place_of_performance_nuts": "CH056",
  "remote_eligible": false,
  "coordinates": { "lat": 46.6986, "lon": 9.4428 },

  // Eligibility
  "set_aside": null,
  "eligibility_conditions": [
    "CHF 2,000,000 professional liability insurance",
    "ISO 9001 certification required",
    "Alpine construction experience mandatory"
  ],
  "required_certifications": ["SBV membership preferred"],
  "language_of_submission": "de",

  // Attachments
  "attachments": [
    { "name": "Ausschreibungsunterlagen.pdf", "url": "...", "size_bytes": 2048000 }
  ],
  "contacts": [
    { "name": "Hans Muster", "email": "...", "phone": "+41 81 257 XX XX", "role": "project manager" }
  ],

  // Status and tracking
  "status": "active | cancelled | awarded | expired | amended",
  "amendments": [
    { "date": "2024-11-28", "description": "Deadline extended to 2025-01-10" }
  ],

  // Embeddings (internal, not exposed to users)
  "embedding": [/* float array, stored in pgvector */],

  // Audit
  "created_at": "2024-11-15T08:00:00Z",
  "updated_at": "2024-11-28T10:00:00Z",
  "expires_at": "2024-12-20T12:00:00Z"
}
```

### Classification Systems Reference

| System | Used By | Level of Detail | Notes |
|---|---|---|---|
| **CPV** (Common Procurement Vocabulary) | EU TED, simap.ch, auftrag.at, most EU portals | 8 digits + check digit | Language-independent; primary filter for EU/CH |
| **NAICS** | US SAM.gov | 6 digits | US-only; maps to business type |
| **PSC** (Product and Service Codes) | US federal | 4 characters | US federal only; >6,000 codes |
| **NIGP** | US state/local | 5 or 7 digits | BidNet Direct, DemandStar, most SLED platforms |
| **UNSPSC** | International private sector | 8 digits hierarchical | SAP Ariba, Coupa prefer this |

**Decision**: CPV as the primary internal taxonomy. Maintain NAICS and NIGP as secondary for US data. Map US data to CPV equivalents where feasible for unified search.

---

## 7. Geographic and Language Architecture

### 7.1 The Swiss Language Challenge

Switzerland presents a unique multi-language challenge that no existing tool handles well:

```
26 cantons → 4 official languages → fragmented tender corpus
├── German (19 cantons): Zurich, Bern, Basel, Luzern, St. Gallen, etc.
├── French (4 cantons + parts of bilingual): Geneva, Vaud, Neuchâtel, Jura
├── Italian (1 canton + parts of Graubünden): Ticino
└── Romansh (parts of Graubünden): Tiny volume, rarely appears in procurement
```

**What this means for search**: A company profile in English or German that searches for "control system modernization" will miss:
- French: "modernisation du système de contrôle"
- Italian: "ammodernamento del sistema di controllo"

**Solution architecture**:
1. **Index all tender titles and descriptions** in their original language
2. **Machine-translate summaries** to all 4 languages on ingest (use DeepL API for CH/EU languages — significantly better than Google Translate for German/French/Italian)
3. **Generate multilingual embeddings** using multilingual models (`multilingual-e5-large` or `paraphrase-multilingual-mpnet-base-v2`)
4. **Store both original and translated versions**; surface original to users who can read the language, translation as fallback
5. **Canton as a first-class geographic filter** (not just NUTS code)

### 7.2 NUTS Codes for Regional Filtering

NUTS (Nomenclature of Territorial Units for Statistics) provides the geographic hierarchy for TED and EU procurement. Key codes for our primary market:

```
Switzerland:
  CH0    Switzerland
  CH01   Région lémanique (Geneva, Vaud, Valais)
  CH02   Espace Mittelland (Bern, Fribourg, Solothurn, Neuchâtel, Jura)
  CH03   Nordwestschweiz (Aargau, Basel-Stadt, Basel-Landschaft)
  CH04   Zürich
  CH05   Ostschweiz (Glarus, Schaffhausen, Appenzell, St. Gallen, Graubünden, Thurgau)
  CH06   Zentralschweiz (Luzern, Uri, Schwyz, Obwalden, Nidwalden, Zug)
  CH07   Ticino

Austria (alpine cantons):
  AT32   Salzburg
  AT33   Tirol
  AT34   Vorarlberg
  AT21   Carinthia (Kärnten)
  AT22   Styria (Steiermark, northern part)

Germany (alpine/southern):
  DE21   Oberbayern
  DE22   Niederbayern
  DE27   Schwaben (Bavarian Alps)

Italy (alpine regions):
  ITH1   Bolzano/Bozen (Alto Adige / South Tyrol)
  ITH2   Trento (Trentino)
  ITC2   Aosta Valley
```

### 7.3 Geographic Filter UX Design Principles

Based on the two use cases and research:

1. **Primary filter should be canton (Switzerland) or country, not NUTS code** — no user knows NUTS codes; they know "Graubünden" and "Ticino"
2. **Allow radius-based filtering** ("within 150km of Chur") for construction firms
3. **Multi-select regions** — an alpine firm might want Graubünden + Valais + Ticino + Tirol (Austria)
4. **"Remote eligible" toggle** for IT firms that don't need to be physically present
5. **Cross-border capability** — a Swiss firm can and does bid on Austrian and Italian alpine contracts

---

## 8. Matching and Relevance Logic

### 8.1 Company Capability Profile

The profile is the foundation of matching. It must capture:

```json
{
  "company": {
    "name": "Alpine Tech GmbH",
    "country": "CH",
    "canton": "GR",
    "city": "Chur",
    "size": "small",
    "languages": ["de", "fr", "it"],
    "certifications": ["ISO 9001", "SBV member", "SUVA certified"]
  },
  "capabilities": {
    "cpv_codes": ["45221200", "45262620", "45233100"],
    "keywords": ["avalanche protection", "Lawinenschutz", "alpine construction", "retaining walls", "slope stabilization"],
    "free_text": "We specialize in construction work in extreme alpine terrain including avalanche galleries, rockfall barriers, steep slope access, and mountain road stabilization. We hold ISO 9001 and are SBV members. All work performed at altitude with rope access capability."
  },
  "filters": {
    "regions": ["CH05", "CH01", "CH07", "AT33", "ITH1"],
    "cantons": ["GR", "VS", "TI", "UR", "GL"],
    "value_min": 300000,
    "value_max": 20000000,
    "currency": "CHF",
    "notice_types": ["rfp", "rfq"],
    "exclude_notice_types": ["award"],
    "remote_eligible": false
  },
  "preferences": {
    "alert_frequency": "realtime",
    "alert_channels": ["email", "slack"],
    "language_preference": "de"
  }
}
```

### 8.2 Matching Levels — Build in This Order

**Level 1 — Hard filters (always apply first, cheap to compute)**
- Geography: place of performance matches selected regions/cantons
- Value: estimated value within company's min/max range
- Notice type: not excluded
- Status: active (not expired, cancelled, or awarded)
- Deadline: more than X days away (configurable)

**Level 2 — NAICS/CPV code matching (fast, structured)**
- Company registers their CPV codes
- RFP's CPV codes checked against company's registered codes
- Exact match, parent match (45221200 matches all under 4522), or child match
- Score: 1.0 for exact, 0.7 for parent/child within same division

**Level 3 — Keyword matching (fast, structured)**
- Full-text index (Postgres `tsvector` or Typesense) on title + description
- Boolean keyword rules: user defines "avalanche OR Lawine OR rockfall"
- Language-aware tokenization (handle German compound words: "Lawinenschutzgalerie" → ["lawine", "schutz", "galerie"])
- Score: TF-IDF weighted relevance

**Level 4 — Semantic embedding matching (powerful, requires ML pipeline)**
- Embed RFP title + description as a vector (multilingual model)
- Embed company capability profile similarly
- Cosine similarity → relevance score 0.0–1.0
- Handles synonyms, translations, adjacent concepts
- Cost: ~$0.02/1M tokens for OpenAI `text-embedding-3-small`, or free with local model
- Implementation: pgvector extension on Postgres (no separate vector DB needed for MVP scale)

**Level 5 — Historical scoring (requires accumulated data, defer)**
- Based on company's bid history (won, lost, no-bid decisions)
- Features: similar CPV codes, similar value range, same issuer, similar deadline lead time
- Outputs: win probability estimate
- Requires 20+ bids in history to be meaningful

### 8.3 Composite Score Formula

```
match_score = (
  0.25 * cpv_match_score +      # structured match
  0.20 * keyword_match_score +  # keyword presence
  0.40 * semantic_similarity +   # meaning-level match
  0.15 * historical_score        # (if available, else redistribute weight)
) * hard_filter_pass             # 0 if any hard filter fails, 1 if all pass
```

Tune weights based on user feedback once live.

---

## 9. Notification and Workflow Design

### 9.1 The Bid Lifecycle

Every opportunity should move through explicit states:

```
New → Reviewing → Bid Decision → In Progress → Submitted → [Won | Lost | Cancelled]
                    ↓
               No Bid → (archived with reason)
```

**State transitions**:
- **New**: Auto-created when RFP matches profile
- **Reviewing**: User opens and reads the RFP
- **Bid Decision**: User makes explicit go/no-go decision with rationale
- **In Progress**: Preparing proposal
- **Submitted**: Proposal submitted (deadline tracking becomes historical)
- **Won/Lost/Cancelled**: Final state, feeds back into historical scoring

### 9.2 Bid/No-Bid Decision Support Fields

When a user marks an opportunity for bid/no-bid decision, capture:
- **Fit score**: 1–5 (auto-suggested, user can override)
- **Strategic value**: 1–5 (user rated — is this a new client? new capability? prestigious?)
- **Estimated effort**: person-hours to prepare proposal
- **Estimated revenue**: (may differ from published estimated value)
- **Win probability**: user estimate (%)
- **Key risks**: free text
- **Decision**: bid / no-bid / watchlist / delegate
- **Assigned to**: team member (for team accounts)
- **Notes**: free text
- **Decision date**: auto-captured

### 9.3 Alert Delivery

| Channel | When to Use | Implementation |
|---|---|---|
| **Email digest** (daily) | Default for all users; lowest friction | SendGrid / Postmark / SMTP |
| **Email instant** | For near-deadline or high-priority matches | Same infrastructure, priority queue |
| **Slack webhook** | Team workflows; channel-based routing | Slack incoming webhooks API |
| **Microsoft Teams** | Enterprise accounts | Teams incoming webhooks |
| **RSS feed** | Power users; integration-friendly | Simple endpoint, `application/rss+xml` |
| **API webhook** | Custom integrations (CRM push) | Outbound webhook with secret |
| **SMS** | Deadline alerts only | Twilio; optional add-on |

### 9.4 Critical Alerts

Beyond "new match" alerts, these are higher priority:

1. **Addendum published**: RFP was modified (deadline extended, scope changed, documents replaced)
2. **Deadline approaching**: T-14, T-7, T-3, T-1 days before response deadline
3. **Q&A deadline approaching**: Questions must be submitted by a certain date
4. **RFP cancelled**: An opportunity the user was tracking has been cancelled
5. **Award published**: For opportunities the user bid on or was watching

### 9.5 Addenda Tracking Architecture

Addenda tracking is technically challenging but competitively important. Most tools ignore it.

**Approach**:
1. On ingest, hash the tender document content and store
2. On every re-poll of the source (daily), re-fetch the tender and compute new hash
3. If hash differs, create an `amendment` record with diff details
4. Alert all users who have this tender in any non-archived state
5. For simap.ch: the `/publications/{id}` endpoint presumably includes version history — confirm during integration testing
6. For TED: amendments are published as new corrigendum notices (`CN-017` notice type) — detect via source_id pattern matching

---

## 10. Technical Architecture

### 10.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA INGESTION LAYER                     │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  simap.ch    │  TED Europa  │  SAM.gov     │  DACH Scrapers     │
│  REST API    │  FTP/API     │  REST API    │  (Playwright)      │
└──────┬───────┴──────┬───────┴──────┬───────┴──────┬─────────────┘
       │              │              │              │
       └──────────────┴──────────────┴──────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Ingest Queue     │
                    │   (Redis/BullMQ)   │
                    └─────────┬──────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼──────┐ ┌──────▼──────┐ ┌─────▼──────────┐
    │  Extraction    │ │  Translation│ │  Embedding     │
    │  Worker        │ │  Worker     │ │  Worker        │
    │  HTML→JSON     │ │  DeepL API  │ │  multilingual  │
    └─────────┬──────┘ └──────┬──────┘ └─────┬──────────┘
              └───────────────┴───────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Normalization     │
                    │  + Deduplication   │
                    └─────────┬──────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
    ┌─────────▼──────────┐       ┌────────────▼───────────┐
    │  PostgreSQL        │       │  Typesense             │
    │  + pgvector        │       │  (full-text search     │
    │  (canonical store) │       │  + faceting)           │
    └─────────┬──────────┘       └────────────┬───────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼──────┐ ┌──────▼──────┐ ┌─────▼──────────┐
    │  Matching      │ │  Alert      │ │  Web API       │
    │  Engine        │ │  Dispatcher │ │  (FastAPI)     │
    └────────────────┘ └─────────────┘ └─────┬──────────┘
                                             │
                                   ┌─────────▼──────────┐
                                   │  Frontend          │
                                   │  (Next.js)         │
                                   └────────────────────┘
```

### 10.2 Stack Decisions

| Layer | Technology | Rationale |
|---|---|---|
| **Backend API** | Python + FastAPI | Async, fast, great ML ecosystem, easy to maintain |
| **Task queue** | Celery + Redis | Battle-tested for scheduled + async jobs; works well with Python |
| **Scraping** | Playwright (Python) + Scrapy | Playwright for JS-rendered pages; Scrapy for simpler HTML; both Python |
| **Database** | PostgreSQL + pgvector | Relational + vector search in one; avoids Pinecone/Weaviate complexity at MVP scale |
| **Full-text search** | Typesense (self-hosted) | Fast, simple, open-source-friendly; better DX than Elasticsearch for this use case |
| **Translation** | DeepL API | Best quality for EU languages (DE/FR/IT/EN). $25/month for 1M chars — sufficient for MVP |
| **Embeddings** | `multilingual-e5-large` (self-hosted) or OpenAI `text-embedding-3-small` | Self-hosted free; OpenAI $0.02/1M tokens. Start with OpenAI, migrate to self-hosted at scale |
| **Frontend** | Next.js (App Router) | SSR for SEO (public tender pages can be indexed), great ecosystem |
| **Alerts** | Postmark | Better deliverability than SendGrid for transactional email |
| **File storage** | S3-compatible (Cloudflare R2) | Tender document attachments; R2 has no egress fees |

### 10.3 Build Phases

#### Phase 1 — Swiss Foundation (2–4 weeks, solo or pair)
- [ ] simap.ch API integration — poll publications endpoint every 2 hours
- [ ] Canonical schema implementation in Postgres
- [ ] Basic normalization + CPV code parsing
- [ ] Simple web UI: search by keyword + CPV + canton + deadline range
- [ ] User accounts + company profiles (basic: name, CPV codes, cantons)
- [ ] Email digest alerts (daily) for matched opportunities
- [ ] Bid tracker: board view with state transitions

#### Phase 2 — European Coverage + Intelligence (4–8 weeks)
- [ ] TED Europa API / FTP bulk ingest (CH + DE + AT + LI coverage from single source)
- [ ] DeepL translation pipeline for FR/IT tender titles and summaries
- [ ] Multilingual embedding generation (pgvector)
- [ ] Semantic search alongside keyword search
- [ ] Addenda detection (hash-based change tracking)
- [ ] Addendum alerts ("This tender was updated")
- [ ] Deadline reminder system (T-14, T-7, T-3)
- [ ] Austrian portal integration (auftrag.at scraper)

#### Phase 3 — US Coverage + Workflow Depth (8–16 weeks)
- [ ] SAM.gov API integration (register API key now — 1–4 week wait)
- [ ] NAICS→CPV mapping table for unified category system
- [ ] State/local US scraping (top 10 portals: Texas, California, New York, Florida, etc.)
- [ ] Deduplication across sources (fuzzy match on solicitation number + title + issuer)
- [ ] Slack/Teams webhooks
- [ ] Bid/no-bid decision capture with analytics
- [ ] Historical win/loss data collection (foundation for scoring in Phase 4)
- [ ] Team accounts + assignment workflow

#### Phase 4 — Intelligence Layer (16+ weeks)
- [ ] Win probability scoring (requires Phase 3 data accumulation)
- [ ] Competitor intelligence (who else is winning similar contracts)
- [ ] Private sector RFP discovery (experimental — requires new data sources)
- [ ] Outbound matching API (webhook push to CRMs: HubSpot, Salesforce)
- [ ] AI-assisted bid/no-bid reasoning ("Based on your history, here's why this opportunity is worth pursuing")

---

## 11. Open Questions — Things We Don't Know Yet

These are the questions that need answering before committing to architecture decisions. Some require prototyping; some require conversation with potential users.

### Data Questions
1. **simap.ch API authentication**: What does the authenticated vs. unauthenticated API surface look like in practice? Does the public API return enough fields or do we need registration as a vendor? **Action**: Prototype API call and document the full response object.

2. **TED FTP bulk format**: What does the XML schema look like in practice? How are Swiss notices distinguished from German notices in the bulk package? How do corrigendum notices (amendments) link back to original notices? **Action**: Download a week of TED FTP data and analyze the schema.

3. **simap.ch document access**: Can tender documents (PDFs) be downloaded without a registered vendor account? Are they publicly accessible URLs or behind authentication? **Action**: Test on a live simap.ch tender.

4. **auftrag.at scraping feasibility**: Is the site JavaScript-rendered or static HTML? Does it have Cloudflare or other anti-bot protection? What's the URL structure for pagination? **Action**: Playwright headless test against the site.

5. **German portal fragmentation**: Is TED sufficient for above-threshold German coverage, or do we need to also scrape German portals to avoid gaps? What percentage of German public contracts are below EU threshold? **Action**: Research the actual threshold gap — estimate volume of sub-threshold German contracts.

### Product Questions
6. **What do users actually want vs. what we assume?** The OT studio and alpine construction use cases are hypothetical. Need to validate with actual potential users before building.
   - Do they discover opportunities through portals today, or through relationships?
   - What's their current "RFP discovery workflow"?
   - What's the most painful part?
   - Would they pay $50/month? $100/month? What would make them pay more?

7. **Below-threshold market access**: Is there a viable way to surface below-threshold opportunities? Options:
   - Monitor cantonal budget planning documents (Voranschlag) for planned infrastructure projects
   - Parse cantonal government meeting minutes (Protokolle des Gemeinderates) for upcoming procurement
   - Partner with trade associations to include their member announcements
   - "Spotted by community" crowdsourcing from platform users

8. **Private sector RFP discovery**: For the OT studio, private industrial companies (Nestlé, ABB, Lonza, Novartis) issue their own procurement. These are on SAP Ariba or sent by email. Is there a viable aggregation path? **Hypothesis**: Not for V1.

9. **Multi-tenant or single-tenant**: Should each company have fully isolated data, or can anonymous aggregated data (e.g., "3 companies in your sector bid on this") add value?

### Technical Questions
10. **Multilingual embedding quality**: How well do existing multilingual embedding models handle Swiss German procurement language? Do German compound words (Lawinenschutzgalerie, Tiefbauprojekt) embed well? **Action**: Benchmark `multilingual-e5-large` against Swiss procurement text samples.

11. **DeepL cost at scale**: At 10,000 new tenders/day × average 500 chars per tender = 5M chars/day = 150M chars/month. DeepL Pro API is ~$25 for 1M chars (basic plan) → ~$3,750/month at this scale. Need a tiered translation strategy: translate summaries only, not full documents. **Action**: Calculate actual translation costs for each tier.

12. **pgvector at scale**: Can pgvector handle cosine similarity search over 1M+ vectors efficiently? What indexes are needed? **Action**: Benchmark before committing; Qdrant may be needed at larger scale.

---

## 12. What "Better Than Anyone" Actually Means

This is a strategic question worth answering directly. "Better" needs to be specific, not generic.

### The Axes of Competition

| Dimension | Current Best | Our Target |
|---|---|---|
| **Geographic coverage** | Patterno: 1,000+ EU portals, €99/month | Start with CH + DACH, expand with Swiss-first quality |
| **Language handling** | Patterno: 26 languages (surface) | Deep: semantic matching across DE/FR/IT with Swiss-specific vocabulary |
| **Relevance quality** | BidNet/DemandStar: CPV/NIGP codes only | Semantic embeddings + keyword + code = genuinely relevant results, not noise |
| **User experience** | Most tools are portals from 2010 | Modern UX: fast, mobile-friendly, keyboard navigation, clean |
| **Price** | GovWin: $15K/yr. Patterno: €99/mo | Free tier (10 alerts/month), Pro €49/month, Team €149/month |
| **Workflow depth** | Most stop at "here's the list" | Full bid lifecycle: track → decide → manage → learn |
| **Addenda tracking** | Almost nobody does this well | Alert on every document change |
| **Below-threshold discovery** | Nobody does this | Partial coverage via cantonal budget monitoring (Phase 4) |
| **Specificity** | Generic keyword search | Profile-based matching: system learns what matters to you |

### The Real Moat

The moat isn't data — the data is mostly free and public. Anyone can call the simap.ch API. The moat is:

1. **Quality of matching** — relevance algorithms that reduce noise. Nobody wants to sift through 200 irrelevant tenders to find 3 good ones.
2. **Multilingual Swiss coverage** — no existing tool does this well for all three language regions of Switzerland.
3. **Workflow integration** — the tool that lives inside a firm's actual BD process (not a portal they check manually) becomes essential.
4. **Learning over time** — a profile that improves based on what the user bids on and wins becomes increasingly accurate. This is a compound advantage that pays off for long-term users.
5. **Speed** — the first firm to know about an opportunity has more time to prepare a better proposal. Near-real-time ingest from simap.ch (API polling every 2 hours) vs. competitors who may update daily.

### What "Better" Looks Like for the Two Use Cases

**For the OT dev studio in Switzerland**:
> Opens the app on Monday morning. Sees 4 new opportunities, ranked by relevance. The top one is a Swissgrid SCADA security audit in German — they'd never have found it because they don't read German procurement fluently. One-click to the full tender. Deadline is 45 days away. They move it to "Reviewing" and assign to their BD lead. Two weeks later, an addendum alert: the scope was expanded and the deadline extended. They catch it in time.

**For the alpine construction firm**:
> Weekly digest of alpine construction tenders in Graubünden, Valais, Tirol, and Ticino, filtered for projects between CHF 300K and CHF 15M involving civil engineering and natural hazard protection. Ten results this week, four are genuinely interesting. One is a cantonal avalanche protection project they didn't know about — it was published in French (Valais) and they would have missed it. Three are repeat opportunities from issuers they've worked with before.

---

## Appendix: CPV Code Reference

### Construction (45xxxxx)
| Code | Description |
|---|---|
| 45220000 | Engineering works and construction |
| 45221000 | Engineering works for bridges and tunnels |
| 45221100 | Bridge construction works |
| 45221200 | Tunnel construction works |
| 45233100 | Construction works for highways, roads |
| 45233140 | Roadworks |
| 45240000 | Hydraulic engineering construction |
| 45262620 | Erection of retaining structures |
| 45112500 | Earthmoving and excavation |
| 45112700 | Land restoration and reclamation |
| 45340000 | Fencing, railing and safety equipment installation |

### IT / OT / Software (72xxxxx, 35xxxxx)
| Code | Description |
|---|---|
| 72200000 | Software programming and consultancy services |
| 72211000 | Programming services of systems and user software |
| 72212000 | Programming services for application software |
| 72310000 | Data processing services |
| 72320000 | Database services |
| 72500000 | Computer-related services |
| 72600000 | Computer support and consultancy services |
| 72720000 | Wide area network services |
| 51100000 | Installation services of electrical/mechanical equipment |
| 51110000 | Installation services of electrical equipment |
| 35120000 | Surveillance and security systems |
| 35125000 | Monitoring system |
| 38500000 | Checking and testing apparatus |
| 38600000 | Optical instruments |

### Civil Engineering / Natural Hazard
| Code | Description |
|---|---|
| 71311000 | Civil engineering consultancy services |
| 71311200 | Highway engineering services |
| 71311300 | Infrastructure engineering services |
| 71312000 | Structural engineering consultancy services |
| 77231600 | Forest protection services (incl. avalanche prevention) |
| 90721500 | Natural disaster protection services |

---

*Document maintained at: `/Users/dd/repos/locallab/rfp-finder/RESEARCH.md`*
*Next step: user interviews + simap.ch API prototyping*
