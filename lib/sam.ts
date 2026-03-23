/**
 * SAM.gov Opportunities API Client (US Federal Procurement)
 *
 * Base URL: https://api.sam.gov/opportunities/v2
 *
 * IMPORTANT: Requires a free API key from sam.gov
 *   Registration: https://sam.gov/content/entity-registration
 *   Key activation takes 1-4 business days after SAM.gov entity registration
 *   Set env var: SAM_GOV_API_KEY=your_key_here
 *
 * Endpoint:
 *   GET /search
 *     params: api_key, postedFrom (MM/DD/YYYY), postedTo, limit, offset,
 *             ptype (o=solicitation, p=presolicitation, k=combined synopsis),
 *             ntype, active (Yes/No)
 *     returns: { opportunitiesData: SamOpportunity[], totalRecords: number }
 *
 * Key fields:
 *   - noticeId: unique ID
 *   - title: English title
 *   - description: description text (may be HTML)
 *   - fullParentPathName: agency/office hierarchy
 *   - organizationHierarchy[]: org tree
 *   - postedDate: "YYYY-MM-DD HH:mm:ss"
 *   - responseDeadLine: "YYYY-MM-DD HH:mm:ss" or null
 *   - naicsCode: NAICS classification (US equivalent of CPV)
 *   - classificationCode: FSC/PSC code
 *   - placeOfPerformance.state.code: 2-letter state code
 *   - uiLink: https://sam.gov/opp/{noticeId}/view
 *   - resourceLinks[]: document URLs
 *   - pointOfContact[]: contacts array
 *
 * Notice types:
 *   - Solicitation (o): open competitive bids ← we want this
 *   - Combined Synopsis/Solicitation (k): simplified acquisition
 *   - Presolicitation (p): advance notice
 *   - Award Notice (a): contract awards — skip
 */

import { stripHtml, daysAgo } from "@/lib/utils";
import type { NormalizedTender } from "@/lib/types";

const BASE_URL = process.env.SAM_BASE_URL ?? "https://api.sam.gov/opportunities/v2";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SamPointOfContact {
  fax?: string;
  type?: string;
  email?: string;
  phone?: string;
  title?: string;
  fullName?: string;
}

interface SamPlaceOfPerformance {
  city?: { code?: string; name?: string };
  state?: { code?: string; name?: string };
  zip?: string;
  country?: { code?: string; name?: string };
}

export interface SamOpportunity {
  noticeId: string;
  title: string;
  solicitationNumber?: string;
  fullParentPathName?: string;
  fullParentPathCode?: string;
  postedDate?: string;           // "YYYY-MM-DD HH:mm:ss"
  type?: string;                 // "o" | "k" | "p" | "a"
  baseType?: string;
  archiveType?: string;
  archiveDate?: string;
  typeOfSetAside?: string;
  typeOfSetAsideDescription?: string;
  responseDeadLine?: string;     // "YYYY-MM-DD HH:mm:ss" or null
  naicsCode?: string;            // "541511" — NAICS (North American Industry Classification)
  naicsCodes?: string[];
  classificationCode?: string;   // FSC/PSC product service code
  active?: string;               // "Yes" | "No"
  award?: {
    date?: string;
    number?: string;
    amount?: string;
    awardee?: { name?: string; ueiSAM?: string };
  };
  pointOfContact?: SamPointOfContact[];
  description?: string;
  organizationType?: string;
  placeOfPerformance?: SamPlaceOfPerformance;
  resourceLinks?: string[];
  uiLink?: string;
}

export interface SamSearchResponse {
  totalRecords: number;
  limit: number;
  offset: number;
  opportunitiesData: SamOpportunity[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

function formatSamDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

/** "YYYY-MM-DD HH:mm:ss" → "YYYY-MM-DDTHH:mm:ss" (ISO-compatible, no timezone) */
function parseSamDate(s: string | null | undefined): string | null {
  if (!s) return null;
  return s.replace(" ", "T");
}

export async function searchSamOpportunities(params: {
  fromDate?: Date;
  toDate?: Date;
  naicsCode?: string;
  keyword?: string;
  limit?: number;
  offset?: number;
}): Promise<SamSearchResponse> {
  const apiKey = process.env.SAM_GOV_API_KEY;
  if (!apiKey) {
    throw new Error(
      "SAM_GOV_API_KEY not set. Register at sam.gov (takes 1-4 days to activate)."
    );
  }

  const {
    fromDate,
    toDate = new Date(),
    naicsCode,
    keyword,
    limit = 100,
    offset = 0,
  } = params;

  const defaultFrom = daysAgo(30);

  const qs = new URLSearchParams({
    api_key: apiKey,
    limit: String(limit),
    offset: String(offset),
    active: "Yes",
    // Solicitations + Combined Synopsis = competitive open bids
    ptype: "o,k",
    postedFrom: formatSamDate(fromDate ?? defaultFrom),
    postedTo: formatSamDate(toDate),
  });

  if (naicsCode) qs.set("naicsCode", naicsCode);
  if (keyword) qs.set("keyword", keyword);

  const url = `${BASE_URL}/search?${qs}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`SAM.gov error ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

export function normalizeSamOpportunity(opp: SamOpportunity): NormalizedTender {
  // Contacts
  const contacts = (opp.pointOfContact ?? [])
    .filter((c) => c.email || c.fullName)
    .map((c) => ({
      name: c.fullName ?? "Primary Contact",
      email: c.email ?? undefined,
      phone: c.phone ?? undefined,
      role: c.type ?? "Contact",
    }));

  // Documents
  const attachments = (opp.resourceLinks ?? []).map((url, i) => ({
    name: `Document ${i + 1}`,
    url,
    size_bytes: undefined,
  }));

  // State/country
  const state = opp.placeOfPerformance?.state?.code ?? null;
  const country = opp.placeOfPerformance?.country?.code ?? "US";

  // NAICS codes as our CPV proxy (standardize to array)
  const cpvCodes = [...new Set([
    ...(opp.naicsCode ? [opp.naicsCode] : []),
    ...(opp.naicsCodes ?? []),
  ])];

  const sourceUrl = opp.uiLink ?? `https://sam.gov/opp/${opp.noticeId}/view`;

  return {
    source_id: `sam-${opp.noticeId}`,
    title: opp.title?.trim() ?? "Untitled",
    description: stripHtml(opp.description),
    issuer_name: opp.fullParentPathName?.split(".").at(-1) ?? "US Government",
    issuer_region: state,
    issuer_country: country === "USA" ? "US" : country,
    cpv_codes: cpvCodes,
    posted_date: parseSamDate(opp.postedDate),
    response_deadline: parseSamDate(opp.responseDeadLine),
    estimated_value_min: null,
    estimated_value_max: null,
    currency: "USD",
    status: "active" as const,
    source_url: sourceUrl,
    attachments,
    contacts,
    raw: opp,
  };
}

// ─── Batch sync ───────────────────────────────────────────────────────────────

export async function fetchAllActiveSamOpportunities(options: {
  fromDate?: Date;
  naicsCode?: string;
  keyword?: string;
  maxPages?: number;
  pageSize?: number;
  delayMs?: number;
}): Promise<NormalizedTender[]> {
  const { maxPages = 20, pageSize = 100, delayMs = 100 } = options;
  const normalized: NormalizedTender[] = [];
  let offset = 0;
  let pages = 0;

  while (pages < maxPages) {
    const result = await searchSamOpportunities({
      fromDate: options.fromDate,
      naicsCode: options.naicsCode,
      keyword: options.keyword,
      limit: pageSize,
      offset,
    });

    const opps = result.opportunitiesData ?? [];
    if (opps.length === 0) break;

    for (const opp of opps) {
      try {
        normalized.push(normalizeSamOpportunity(opp));
      } catch (e) {
        console.warn(`SAM normalize error for ${opp.noticeId}:`, e);
      }
    }

    pages++;
    if (opps.length < pageSize) break;
    offset += pageSize;

    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }

  console.log(`SAM sync: normalized ${normalized.length} opportunities (${pages} pages)`);
  return normalized;
}
