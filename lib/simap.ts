/**
 * simap.ch API Client — verified against the live API on 2026-03-18
 *
 * Base URL: https://www.simap.ch/api
 *
 * Endpoints used:
 *   GET /publications/v2/project/project-search
 *     params: search, size, page, orderAddressCantons, cpcCodes
 *     returns: { projects: SimapProject[] }
 *
 *   GET /publications/v1/project/{projectId}/publication-details/{publicationId}
 *     returns: SimapPublicationDetail
 *
 * The API is a two-step process:
 *   1. Search returns lightweight project summaries (id, title, pubType, canton, etc.)
 *   2. Fetch detail for each project to get deadline, description, CPV, contacts
 *
 * pubType values: "tender" | "award" | "participant_selection" | "invitation_to_tender"
 * We only care about: "tender" and "participant_selection" (active open tenders)
 */

const BASE_URL = process.env.SIMAP_BASE_URL ?? "https://www.simap.ch/api";

// ─── Search result (lightweight) ─────────────────────────────────────────────

export interface SimapProject {
  id: string;                    // projectId
  publicationId: string;
  title: Record<string, string | null>;   // { de, fr, it, en }
  projectNumber: string;
  projectType: string;           // "tender"
  projectSubType: string;        // "construction" | "service" | "supply"
  processType: string;           // "open" | "selective" | "negotiated"
  pubType: string;               // "tender" | "award" | "participant_selection"
  publicationDate: string;       // "2026-03-18"
  publicationNumber: string;
  corrected: boolean;
  procOfficeName: Record<string, string | null>;
  orderAddress: {
    countryId: string;
    cantonId: string | null;
    postalCode: string | null;
    city: Record<string, string | null> | null;
  };
  lots: unknown[];
}

export interface SimapSearchResponse {
  projects: SimapProject[];
}

// ─── Publication detail (full) ────────────────────────────────────────────────

export interface SimapPublicationDetail {
  id: string;
  type: string;
  projectType: string;
  "project-info": {
    title: Record<string, string | null>;
    procOfficeAddress: {
      name: Record<string, string | null>;
      contactPerson: Record<string, string | null>;
      phone: string | null;
      email: string | null;
      cantonId: string | null;
      postalCode: string | null;
      city: Record<string, string | null>;
      street: Record<string, string | null>;
    };
    processType: string;
    orderType: string;
  };
  procurement: {
    orderDescription: Record<string, string | null>;
    cpvCode: {
      code: string;
      label: Record<string, string | null>;
    } | null;
    additionalCpvCodes: {
      code: string;
      label: Record<string, string | null>;
    }[];
    orderAddress: {
      countryId: string;
      cantonId: string | null;
    } | null;
  };
  dates: {
    publicationDate: string;
    offerDeadline: string | null;       // ISO datetime e.g. "2026-03-23T23:59:00+01:00"
    qnas: { id: string; date: string }[];
  };
  hasProjectDocuments: boolean;
  base: {
    projectId: string;
    publicationNumber: string;
    projectNumber: string;
  };
}

// ─── API helpers ──────────────────────────────────────────────────────────────

function headers(): HeadersInit {
  return {
    Accept: "application/json",
    "User-Agent": "TenderRadar/0.1",
  };
}

/**
 * Search for projects. Returns lightweight summaries.
 * Only returns pubType "tender" and "participant_selection" by default
 * (skips award notices which are historical).
 */
export async function searchProjects(params: {
  search?: string;
  page?: number;
  size?: number;
  cantons?: string[];           // e.g. ["GR", "VS"]
  cpvPrefix?: string;           // e.g. "45" for construction
  activeOnly?: boolean;
}): Promise<SimapSearchResponse> {
  const qs = new URLSearchParams();
  qs.set("size", String(params.size ?? 50));
  qs.set("page", String(params.page ?? 0));

  if (params.search) qs.set("search", params.search);

  // Canton filter
  if (params.cantons && params.cantons.length > 0) {
    params.cantons.forEach((c) => qs.append("orderAddressCantons", c));
  }

  // CPV prefix filter
  if (params.cpvPrefix) qs.set("cpcCodes", params.cpvPrefix);

  const url = `${BASE_URL}/publications/v2/project/project-search?${qs}`;
  const res = await fetch(url, { headers: headers(), cache: "no-store" });

  if (!res.ok) {
    throw new Error(`simap search error ${res.status}: ${await res.text()}`);
  }

  const data: SimapSearchResponse = await res.json();

  // Filter out award notices — we want open tenders only
  if (params.activeOnly !== false) {
    data.projects = data.projects.filter(
      (p) => p.pubType === "tender" || p.pubType === "participant_selection"
    );
  }

  return data;
}

/**
 * Fetch full publication detail for a single project.
 */
export async function fetchPublicationDetail(
  projectId: string,
  publicationId: string
): Promise<SimapPublicationDetail> {
  const url = `${BASE_URL}/publications/v1/project/${projectId}/publication-details/${publicationId}`;
  const res = await fetch(url, { headers: headers(), cache: "no-store" });

  if (!res.ok) {
    throw new Error(`simap detail error ${res.status} for ${projectId}/${publicationId}`);
  }

  return res.json();
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

/** Pick first non-null value from a multilingual object, preferring DE > FR > IT > EN */
function pickText(obj: Record<string, string | null> | null | undefined): string | null {
  if (!obj) return null;
  return obj.de ?? obj.fr ?? obj.it ?? obj.en ?? null;
}

/**
 * Normalize a simap project + detail into our canonical Tender schema.
 */
export function normalizeTender(
  project: SimapProject,
  detail: SimapPublicationDetail
) {
  const info = detail["project-info"];
  const proc = detail.procurement;
  const dates = detail.dates;

  // Title — pick first available language
  const title = pickText(info.title) ?? pickText(project.title) ?? "Untitled";

  // Description from order description
  const description = pickText(proc.orderDescription);

  // Issuer
  const issuerName =
    pickText(info.procOfficeAddress.name) ??
    pickText(project.procOfficeName) ??
    "Unknown";

  // Canton — prefer from procurement address, fall back to project's orderAddress
  const canton =
    proc.orderAddress?.cantonId ??
    info.procOfficeAddress.cantonId ??
    project.orderAddress?.cantonId ??
    null;

  // CPV codes — primary + additional
  const cpvCodes: string[] = [];
  if (proc.cpvCode?.code) cpvCodes.push(proc.cpvCode.code);
  proc.additionalCpvCodes.forEach((c) => cpvCodes.push(c.code));

  // Contacts
  const contacts = [];
  const contactPerson = pickText(info.procOfficeAddress.contactPerson);
  if (contactPerson || info.procOfficeAddress.email) {
    contacts.push({
      name: contactPerson ?? issuerName,
      email: info.procOfficeAddress.email ?? undefined,
      phone: info.procOfficeAddress.phone ?? undefined,
      role: "Procurement Contact",
    });
  }

  // Status
  let status: "active" | "cancelled" | "awarded" | "expired" = "active";
  if (project.pubType === "award") status = "awarded";

  // Source URL — construct the simap.ch notice URL
  const sourceUrl = `https://www.simap.ch/en/home/tenders/tender-detail.html?projectId=${project.id}&publicationId=${project.publicationId}`;

  // Attachments — simap stores documents on the platform, not via API URLs
  // Mark if documents exist so the UI can show a link to simap
  const attachments = detail.hasProjectDocuments
    ? [{
        name: "Tender Documents (simap.ch)",
        url: sourceUrl,
        size_bytes: undefined,
      }]
    : [];

  return {
    source_id: `simap-${project.publicationId}`,
    title: title.trim(),
    description: description ? description.replace(/<[^>]+>/g, " ").trim() : null,
    issuer_name: issuerName,
    issuer_canton: canton?.toUpperCase().slice(0, 2) ?? null,
    cpv_codes: cpvCodes,
    posted_date: dates.publicationDate ?? project.publicationDate ?? null,
    response_deadline: dates.offerDeadline ?? null,
    estimated_value_min: null,   // simap rarely publishes estimated values publicly
    estimated_value_max: null,
    currency: "CHF",
    status,
    source_url: sourceUrl,
    attachments,
    contacts,
    raw: { project, detail },
  };
}

// ─── Batch sync helper ────────────────────────────────────────────────────────

/**
 * Fetch all open tenders, paginating until we have everything or hit maxPages.
 * Returns normalized tender records ready for upsert.
 */
export async function fetchAllOpenTenders(options: {
  search?: string;
  cantons?: string[];
  maxPages?: number;
  pageSize?: number;
  delayMs?: number;
}): Promise<ReturnType<typeof normalizeTender>[]> {
  const { maxPages = 20, pageSize = 50, delayMs = 300 } = options;
  const normalized: ReturnType<typeof normalizeTender>[] = [];

  let page = 0;
  let fetched = 0;

  while (page < maxPages) {
    const result = await searchProjects({
      search: options.search ?? "",
      cantons: options.cantons,
      page,
      size: pageSize,
      activeOnly: true,
    });

    const projects = result.projects;
    if (projects.length === 0) break;

    fetched += projects.length;

    // Fetch details in parallel batches of 5
    for (let i = 0; i < projects.length; i += 5) {
      const batch = projects.slice(i, i + 5);
      const details = await Promise.allSettled(
        batch.map((p) => fetchPublicationDetail(p.id, p.publicationId))
      );

      details.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          try {
            normalized.push(normalizeTender(batch[idx], result.value));
          } catch (e) {
            console.warn(`Normalize error for ${batch[idx].id}:`, e);
          }
        } else {
          console.warn(`Detail fetch failed for ${batch[idx].id}:`, result.reason);
        }
      });

      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    }

    // simap returns 20 results per page by default; if we got fewer than pageSize, we're done
    if (projects.length < pageSize) break;
    page++;
  }

  console.log(`simap sync: fetched ${fetched} projects, normalized ${normalized.length}`);
  return normalized;
}
