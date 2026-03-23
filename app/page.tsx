import { Suspense } from "react";
import { sql, rawQuery } from "@/lib/db";
import type { Tender, FilterParams } from "@/lib/types";
import TenderCard from "@/components/tender-card";
import TenderFilters from "@/components/tender-filters";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[]>;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Feed</h1>
          <p className="text-sm text-zinc-500 mt-0.5 font-mono">
            Swiss public procurement — simap.ch
          </p>
        </div>
        <SyncStatus />
      </div>

      {/* Filters */}
      <Suspense>
        <TenderFilters />
      </Suspense>

      {/* Results */}
      <Suspense fallback={<TableSkeleton />}>
        <TenderTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function TenderTable({
  searchParams,
}: {
  searchParams: Record<string, string | string[]>;
}) {
  const get = (key: string) => {
    const v = searchParams[key];
    return Array.isArray(v) ? v[0] : v ?? "";
  };
  const getAll = (key: string) => {
    const v = searchParams[key];
    return Array.isArray(v) ? v : v ? [v] : [];
  };

  const page = Math.max(1, Number(get("page") || "1"));
  const pageSize = 25;
  const offset = (page - 1) * pageSize;

  const keyword   = get("keyword");
  const cantons   = getAll("canton");
  const cpvPrefix = get("cpv");
  const valueMin  = get("value_min");
  const valueMax  = get("value_max");
  const status    = get("status") || "active";

  // Build query
  const conditions: string[] = [`t.status = '${status}'`];
  const values: (string | number)[] = [];
  let p = 1;

  if (cantons.length > 0) {
    const list = cantons.map(() => `$${p++}`).join(", ");
    conditions.push(`t.issuer_region IN (${list})`);
    values.push(...cantons);
  }

  if (cpvPrefix) {
    conditions.push(`EXISTS (SELECT 1 FROM jsonb_array_elements_text(t.cpv_codes) c WHERE c LIKE $${p++})`);
    values.push(`${cpvPrefix}%`);
  }

  if (valueMin) {
    conditions.push(`(t.estimated_value_max IS NULL OR t.estimated_value_max >= $${p++})`);
    values.push(Number(valueMin));
  }

  if (valueMax) {
    conditions.push(`(t.estimated_value_min IS NULL OR t.estimated_value_min <= $${p++})`);
    values.push(Number(valueMax));
  }

  if (keyword) {
    conditions.push(`(t.title ILIKE $${p} OR t.description ILIKE $${p} OR t.issuer_name ILIKE $${p})`);
    values.push(`%${keyword}%`);
    p++;
  }

  const where = conditions.join(" AND ");

  const [countRows, dataRows] = await Promise.all([
    rawQuery<{ total: string }>(`SELECT COUNT(*) as total FROM tenders t WHERE ${where}`, values),
    rawQuery<Record<string, unknown>>(
      `SELECT id, source_id, title, description, issuer_name, issuer_region,
              cpv_codes, posted_date, response_deadline,
              estimated_value_min, estimated_value_max, currency,
              status, source_url, attachments, contacts, created_at, updated_at
       FROM tenders t WHERE ${where}
       ORDER BY
         CASE WHEN response_deadline IS NULL THEN 1 ELSE 0 END,
         response_deadline ASC, posted_date DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...values, pageSize, offset]
    ),
  ]);

  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.ceil(total / pageSize);
  const tenders: Tender[] = dataRows as unknown as Tender[];

  if (tenders.length === 0) {
    return (
      <EmptyState keyword={keyword} cantons={cantons} />
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tender</th>
              <th className="hidden md:table-cell">CPV</th>
              <th className="hidden lg:table-cell">Value</th>
              <th>Deadline</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className="stagger">
            {tenders.map((tender) => (
              <TenderCard key={tender.id} tender={tender} variant="row" />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
      )}

      <p className="text-xs text-zinc-600 mono text-right">
        {total.toLocaleString()} tender{total !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500 mono">
        {from}–{to} of {total.toLocaleString()}
      </span>
      <div className="flex gap-1">
        {page > 1 && (
          <a
            href={`?page=${page - 1}`}
            className="px-3 py-1.5 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs mono transition-colors"
          >
            ← Prev
          </a>
        )}
        {page < totalPages && (
          <a
            href={`?page=${page + 1}`}
            className="px-3 py-1.5 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs mono transition-colors"
          >
            Next →
          </a>
        )}
      </div>
    </div>
  );
}

async function SyncStatus() {
  try {
    const rows = await sql`
      SELECT finished_at, records_upserted, status
      FROM sync_log
      WHERE status = 'success'
      ORDER BY finished_at DESC
      LIMIT 1
    `;
    if (!rows.length) return null;
    const { finished_at } = rows[0];
    return (
      <span className="text-xs text-zinc-600 mono">
        Last sync {formatDate(String(finished_at))}
      </span>
    );
  } catch {
    return null;
  }
}

function EmptyState({ keyword, cantons }: { keyword?: string; cantons?: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-zinc-600">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-zinc-400 text-sm">No tenders found</p>
      {(keyword || (cantons && cantons.length > 0)) && (
        <p className="text-zinc-600 text-xs mt-1 mono">Try adjusting your filters</p>
      )}
      <p className="text-zinc-700 text-xs mt-3 mono max-w-xs">
        Run a sync to pull the latest tenders from simap.ch
      </p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden animate-pulse">
      <div className="h-10 bg-zinc-900 border-b border-zinc-800" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-16 border-b border-zinc-800/50 bg-zinc-900/20" />
      ))}
    </div>
  );
}
