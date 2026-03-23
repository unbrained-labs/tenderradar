/**
 * Find a Tender Service (FTS) — UK Public Procurement API
 * verified against the live API on 2026-03-23
 *
 * Base URL: https://www.find-tender.service.gov.uk/api/1.0
 *
 * Endpoint:
 *   GET /ocdsReleasePackages
 *     params: limit, updatedFrom, updatedTo, cursor (for pagination)
 *     returns: OCDS release package (Open Contracting Data Standard)
 *
 * Key findings:
 *   - Uses OCDS format — releases have tags: ["tender"], ["award","contract"], ["planning"]
 *   - We want releases where tender.status = "active" or tag includes "tender"
 *   - Pagination: cursor-based via response `links.next` URL
 *   - No API key required for public data
 *   - CPV codes are under tender.items[].additionalClassifications[scheme="CPV"]
 *     OR awards[].items[].additionalClassifications[scheme="CPV"]
 *   - Deadline: tender.tenderPeriod.endDate (ISO datetime)
 *   - Buyer: parties[] where roles includes "buyer"
 *   - Value: tender.value.amount + currency (or in awards[].value)
 *   - Contact: buyer party contactPoint.email / telephone
 *   - Notice URL: https://www.find-tender.service.gov.uk/Notice/{id}
 */

const BASE_URL =
  process.env.FTS_BASE_URL ?? "https://www.find-tender.service.gov.uk/api/1.0";

// ─── OCDS types ───────────────────────────────────────────────────────────────

interface OcdsClassification {
  scheme: string;   // "CPV"
  id: string;       // "72200000"
  description?: string;
}

interface OcdsItem {
  id: string;
  additionalClassifications?: OcdsClassification[];
}

interface OcdsParty {
  id: string;
  name: string;
  roles: string[];
  address?: {
    region?: string;
    country?: string;
    countryName?: string;
    streetAddress?: string;
    locality?: string;
    postalCode?: string;
  };
  contactPoint?: {
    name?: string;
    email?: string;
    telephone?: string;
  };
}

interface OcdsTender {
  id: string;
  title?: string;
  description?: string;
  status?: string;       // "active" | "complete" | "cancelled" | "planned"
  procurementMethod?: string;
  tenderPeriod?: {
    startDate?: string;
    endDate?: string;
  };
  value?: {
    amount?: number;
    amountGross?: number;
    currency?: string;
  };
  items?: OcdsItem[];
  lots?: { id: string; status?: string }[];
  documents?: { id: string; url?: string; title?: string; documentType?: string }[];
}

export interface FtsRelease {
  id: string;            // "026268-2026"
  ocid: string;          // "ocds-h6vhtk-058f30"
  date: string;          // ISO datetime
  tag: string[];         // ["tender"] | ["award", "contract"] | ["planning"]
  buyer?: { id: string; name: string };
  parties?: OcdsParty[];
  tender?: OcdsTender;
  awards?: {
    id: string;
    value?: { amount?: number; amountGross?: number; currency?: string };
    items?: OcdsItem[];
  }[];
}

export interface FtsPackage {
  releases: FtsRelease[];
  links?: { next?: string };
}

// ─── API ──────────────────────────────────────────────────────────────────────

export async function fetchFtsReleases(params: {
  updatedFrom?: string;  // ISO datetime e.g. "2026-01-01T00:00:00"
  limit?: number;
  cursor?: string;
}): Promise<FtsPackage> {
  const { updatedFrom, limit = 100, cursor } = params;

  const qs = new URLSearchParams({ limit: String(limit) });
  if (updatedFrom) qs.set("updatedFrom", updatedFrom);
  if (cursor) qs.set("cursor", cursor);

  const url = `${BASE_URL}/ocdsReleasePackages?${qs}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`FTS error ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractCpvCodes(items?: OcdsItem[]): string[] {
  if (!items) return [];
  const codes: string[] = [];
  for (const item of items) {
    for (const cls of item.additionalClassifications ?? []) {
      if (cls.scheme === "CPV" && cls.id) codes.push(cls.id);
    }
  }
  return [...new Set(codes)];
}

function isActiveTender(release: FtsRelease): boolean {
  return (
    release.tag.includes("tender") &&
    !release.tag.includes("award") &&
    (release.tender?.status === "active" || release.tender?.status === "planned")
  );
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

export function normalizeFtsRelease(release: FtsRelease) {
  const tender = release.tender ?? {};
  const parties = release.parties ?? [];
  const buyer = parties.find((p) => p.roles?.includes("buyer"));

  // CPV codes from tender items
  const cpvCodes = extractCpvCodes(tender.items);

  // Contacts
  const contacts = [];
  if (buyer?.contactPoint) {
    contacts.push({
      name: buyer.contactPoint.name ?? buyer.name,
      email: buyer.contactPoint.email ?? undefined,
      phone: buyer.contactPoint.telephone ?? undefined,
      role: "Buyer Contact",
    });
  }

  // Value
  const value = tender.value;
  const currency = value?.currency ?? "GBP";
  const amount = value?.amount ?? value?.amountGross ?? null;

  // Documents
  const attachments = (tender.documents ?? [])
    .filter((d) => d.url)
    .map((d) => ({
      name: d.title ?? d.documentType ?? "Document",
      url: d.url!,
      size_bytes: undefined,
    }));

  // Source URL
  const sourceUrl = `https://www.find-tender.service.gov.uk/Notice/${release.id}`;

  return {
    source_id: `fts-${release.ocid}`,
    title: (tender.title ?? "Untitled").trim(),
    description: tender.description
      ? tender.description.replace(/<[^>]+>/g, " ").trim()
      : null,
    issuer_name: buyer?.name ?? release.buyer?.name ?? "Unknown",
    issuer_region: null,
    issuer_country: "GB",
    cpv_codes: cpvCodes,
    posted_date: release.date?.split("T")[0] ?? null,
    response_deadline: tender.tenderPeriod?.endDate ?? null,
    estimated_value_min: amount,
    estimated_value_max: amount,
    currency,
    status: "active" as const,
    source_url: sourceUrl,
    attachments,
    contacts,
    raw: release,
  };
}

// ─── Batch sync ───────────────────────────────────────────────────────────────

export async function fetchAllActiveFtsTenders(options: {
  fromDate?: string;    // ISO datetime, defaults to 30 days ago
  maxPages?: number;
  pageSize?: number;
  delayMs?: number;
}): Promise<ReturnType<typeof normalizeFtsRelease>[]> {
  const { maxPages = 20, pageSize = 100, delayMs = 200 } = options;

  const fromDate = options.fromDate ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 19);
  })();

  const normalized: ReturnType<typeof normalizeFtsRelease>[] = [];
  let cursor: string | undefined;
  let pages = 0;

  while (pages < maxPages) {
    const pkg = await fetchFtsReleases({
      updatedFrom: fromDate,
      limit: pageSize,
      cursor,
    });

    const releases = pkg.releases ?? [];

    for (const release of releases) {
      if (!isActiveTender(release)) continue;
      try {
        normalized.push(normalizeFtsRelease(release));
      } catch (e) {
        console.warn(`FTS normalize error for ${release.id}:`, e);
      }
    }

    pages++;

    // Follow cursor pagination
    const nextUrl = pkg.links?.next;
    if (!nextUrl || releases.length < pageSize) break;

    // Extract cursor from next URL
    const m = nextUrl.match(/cursor=([^&]+)/);
    if (!m) break;
    cursor = decodeURIComponent(m[1]);

    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }

  console.log(`FTS sync: normalized ${normalized.length} active tenders (${pages} pages)`);
  return normalized;
}
