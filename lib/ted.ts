/**
 * TED Europa API Client — verified against the live API on 2026-03-23
 *
 * Base URL: https://api.ted.europa.eu/v3
 *
 * Endpoints used:
 *   POST /notices/search
 *     body: { query, page, limit, fields }
 *     query syntax: field = value | field >= YYYYMMDD | field AND field
 *     returns: { notices: TedNotice[], totalNoticeCount: number }
 *
 * Key findings from live API probing:
 *   - Notice types we care about: cn-standard, cn-social (contract notices / open tenders)
 *   - "can-*" types are contract award notices (historical) — skip these
 *   - notice-title and organisation-name-buyer are multilingual objects:
 *       { eng: "...", deu: "...", fra: "...", pol: "...", ... }
 *     Language codes are ISO 639-2/T (3-letter lowercase: eng, deu, fra, ita, etc.)
 *   - Array fields (per-lot): deadline-receipt-tender-date-lot, classification-cpv,
 *     description-lot, estimated-value-lot — take the first element
 *   - organisation-country-buyer is ISO 3166-1 alpha-3 (CHE, FRA, DEU, POL...)
 *   - Date query syntax: publication-date >= 20260101 (YYYYMMDD integer, no quotes)
 *   - No API key needed for public searches
 *
 * Notice URL pattern: https://ted.europa.eu/en/notice/{publication-number}/html
 */

const BASE_URL = process.env.TED_BASE_URL ?? "https://api.ted.europa.eu/v3";

// ─── Response types ───────────────────────────────────────────────────────────

/** Multilingual string object — keys are ISO 639-2/T language codes */
type MultiLang = Record<string, string | string[] | null>;

export interface TedNotice {
  "publication-number": string;          // e.g. "95174-2016"
  "notice-type": string;                 // "cn-standard" | "cn-social" | "can-standard" | ...
  "notice-title"?: MultiLang;            // { eng: "...", deu: "...", fra: "...", ... }
  "organisation-name-buyer"?: MultiLang; // { pol: ["National Cancer Inst"] }
  "organisation-country-buyer"?: string[];  // ["CHE"] (ISO 3166-1 alpha-3)
  "classification-cpv"?: string[];       // ["45221200", "72200000"] — one per lot, may repeat
  "publication-date"?: string;           // "2026-01-02+01:00"
  "deadline-receipt-tender-date-lot"?: string[]; // per-lot deadlines
  "deadline-date-lot"?: string[];
  "description-lot"?: MultiLang;         // per lot, multilingual
  "description-part"?: MultiLang;
  "estimated-value-lot"?: number[];
  "estimated-value-cur-lot"?: string[];
  "place-of-performance-country-lot"?: string[];
  "place-of-performance-country-part"?: string[];
  links?: {
    html?: Record<string, string>;
    pdf?: Record<string, string>;
  };
}

export interface TedSearchResponse {
  notices: TedNotice[];
  totalNoticeCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pick first non-null text from a multilingual object, preferring EN > DE > FR > IT */
function pickMultiLang(obj: MultiLang | null | undefined): string | null {
  if (!obj) return null;
  const preferred = ["eng", "deu", "fra", "ita", "nld", "pol"];
  for (const lang of preferred) {
    const val = obj[lang];
    if (!val) continue;
    if (Array.isArray(val)) return val[0] ?? null;
    return val;
  }
  // fall back to first available
  for (const val of Object.values(obj)) {
    if (!val) continue;
    if (Array.isArray(val)) return val[0] ?? null;
    return val;
  }
  return null;
}

/** Convert ISO 3166-1 alpha-3 country code to alpha-2 */
const ALPHA3_TO_2: Record<string, string> = {
  AUT: "AT", BEL: "BE", BGR: "BG", HRV: "HR", CYP: "CY", CZE: "CZ",
  DNK: "DK", EST: "EE", FIN: "FI", FRA: "FR", DEU: "DE", GRC: "GR",
  HUN: "HU", IRL: "IE", ITA: "IT", LVA: "LV", LTU: "LT", LUX: "LU",
  MLT: "MT", NLD: "NL", POL: "PL", PRT: "PT", ROU: "RO", SVK: "SK",
  SVN: "SI", ESP: "ES", SWE: "SE", CHE: "CH", NOR: "NO", ISL: "IS",
  GBR: "GB", USA: "US", CAN: "CA",
};

function alpha3to2(code: string): string {
  return ALPHA3_TO_2[code.toUpperCase()] ?? code.slice(0, 2).toUpperCase();
}

/** Format date YYYYMMDD for expert query */
function toQueryDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const TED_FIELDS = [
  "notice-title",
  "organisation-name-buyer",
  "organisation-country-buyer",
  "classification-cpv",
  "publication-date",
  "deadline-receipt-tender-date-lot",
  "deadline-date-lot",
  "description-lot",
  "description-part",
  "estimated-value-lot",
  "estimated-value-cur-lot",
  "notice-type",
  "place-of-performance-country-lot",
  "place-of-performance-country-part",
];

export async function searchTedNotices(params: {
  fromDate?: Date;
  countries?: string[];   // ISO 3166-1 alpha-3, e.g. ["CHE", "DEU"]
  cpvPrefix?: string;     // e.g. "45" for construction
  page?: number;
  limit?: number;
}): Promise<TedSearchResponse> {
  const { fromDate, countries, cpvPrefix, page = 1, limit = 50 } = params;

  // Build expert query
  const clauses: string[] = [
    "notice-type = cn-standard OR notice-type = cn-social",
  ];

  if (fromDate) {
    clauses.push(`publication-date >= ${toQueryDate(fromDate)}`);
  }

  if (countries && countries.length > 0) {
    const countryClause = countries
      .map((c) => `organisation-country-buyer = ${c}`)
      .join(" OR ");
    clauses.push(`(${countryClause})`);
  }

  if (cpvPrefix) {
    clauses.push(`classification-cpv ~ ${cpvPrefix}`);
  }

  const query = clauses.join(" AND ");

  const body = { query, page, limit, fields: TED_FIELDS };

  const res = await fetch(`${BASE_URL}/notices/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`TED search error ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

export function normalizeTedNotice(notice: TedNotice) {
  const pubNum = notice["publication-number"];

  // Title
  const title = pickMultiLang(notice["notice-title"]) ?? "Untitled";

  // Description — try lot first, then part
  const descRaw =
    pickMultiLang(notice["description-lot"]) ??
    pickMultiLang(notice["description-part"]);
  const description = descRaw
    ? descRaw.replace(/<[^>]+>/g, " ").trim()
    : null;

  // Issuer
  const issuerName = pickMultiLang(notice["organisation-name-buyer"]) ?? "Unknown";

  // Country (first buyer country → 2-letter)
  const countryAlpha3 = notice["organisation-country-buyer"]?.[0] ?? null;
  const countryAlpha2 = countryAlpha3 ? alpha3to2(countryAlpha3) : null;

  // CPV codes — deduplicate
  const cpvCodes = [...new Set(notice["classification-cpv"] ?? [])];

  // Deadline — first lot deadline
  const deadlineRaw =
    notice["deadline-receipt-tender-date-lot"]?.[0] ??
    notice["deadline-date-lot"]?.[0] ??
    null;

  // Estimated value — first lot value
  const valueRaw = notice["estimated-value-lot"]?.[0] ?? null;
  const currency = notice["estimated-value-cur-lot"]?.[0] ?? "EUR";

  // Source URL
  const sourceUrl = `https://ted.europa.eu/en/notice/${pubNum}/html`;

  return {
    source_id: `ted-${pubNum}`,
    title: title.trim(),
    description,
    issuer_name: issuerName,
    issuer_canton: null,       // EU tenders use country, not canton
    issuer_country: countryAlpha2,
    cpv_codes: cpvCodes,
    posted_date: notice["publication-date"]?.split("+")[0]?.split("Z")[0] ?? null,
    response_deadline: deadlineRaw ?? null,
    estimated_value_min: valueRaw,
    estimated_value_max: valueRaw,
    currency,
    status: "active" as const,
    source_url: sourceUrl,
    attachments: [],
    contacts: [],
    raw: notice,
  };
}

// ─── Batch sync ───────────────────────────────────────────────────────────────

export async function fetchAllOpenTedNotices(options: {
  countries?: string[];
  cpvPrefix?: string;
  maxPages?: number;
  pageSize?: number;
  delayMs?: number;
  fromDate?: Date;
}): Promise<ReturnType<typeof normalizeTedNotice>[]> {
  const { maxPages = 20, pageSize = 50, delayMs = 300 } = options;

  // Default: last 30 days
  const fromDate = options.fromDate ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  })();

  const normalized: ReturnType<typeof normalizeTedNotice>[] = [];
  let page = 1;

  while (page <= maxPages) {
    const result = await searchTedNotices({
      ...options,
      fromDate,
      page,
      limit: pageSize,
    });

    const notices = result.notices;
    if (notices.length === 0) break;

    for (const notice of notices) {
      try {
        normalized.push(normalizeTedNotice(notice));
      } catch (e) {
        console.warn(`TED normalize error for ${notice["publication-number"]}:`, e);
      }
    }

    if (notices.length < pageSize) break;
    page++;

    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }

  console.log(`TED sync: normalized ${normalized.length} notices (${page - 1} pages)`);
  return normalized;
}
