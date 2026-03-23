import { notFound } from "next/navigation";
import Link from "next/link";
import { sql } from "@/lib/db";
import type { Tender } from "@/lib/types";
import { formatDate, formatValueRange, daysUntil, deadlineUrgency, cn } from "@/lib/utils";
import { getCpvLabel } from "@/lib/cpv-codes";
import { getCantonName } from "@/lib/cantons";
import CpvBadge from "@/components/cpv-badge";
import DeadlineBadge from "@/components/deadline-badge";
import AddToTrackerButton from "./add-to-tracker";

export const dynamic = "force-dynamic";

export default async function TenderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const rows = await sql`
    SELECT
      id, source_id, title, description, issuer_name, issuer_region,
      cpv_codes, posted_date, response_deadline,
      estimated_value_min, estimated_value_max, currency,
      status, source_url, attachments, contacts,
      created_at, updated_at
    FROM tenders
    WHERE id = ${params.id}
    LIMIT 1
  `;

  if (!rows.length) notFound();

  const row = rows[0];
  const tender: Tender = {
    id:               String(row.id),
    source_id:        String(row.source_id),
    title:            String(row.title ?? ""),
    description:      row.description ? String(row.description) : null,
    issuer_name:      String(row.issuer_name ?? ""),
    issuer_region:    row.issuer_region ? String(row.issuer_region) : null,
    cpv_codes:        Array.isArray(row.cpv_codes) ? row.cpv_codes as string[] : [],
    posted_date:      String(row.posted_date ?? ""),
    response_deadline:row.response_deadline ? String(row.response_deadline) : null,
    estimated_value_min: row.estimated_value_min != null ? Number(row.estimated_value_min) : null,
    estimated_value_max: row.estimated_value_max != null ? Number(row.estimated_value_max) : null,
    currency:         String(row.currency ?? "CHF"),
    status:           (row.status as Tender["status"]) ?? "active",
    source_url:       String(row.source_url ?? ""),
    attachments:      Array.isArray(row.attachments) ? row.attachments as Tender["attachments"] : [],
    contacts:         Array.isArray(row.contacts) ? row.contacts as Tender["contacts"] : [],
    created_at:       String(row.created_at ?? ""),
    updated_at:       String(row.updated_at ?? ""),
  };

  const urgency = deadlineUrgency(tender.response_deadline);
  const days = daysUntil(tender.response_deadline);

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mono text-zinc-600">
        <Link href="/" className="hover:text-zinc-400 transition-colors">Feed</Link>
        <span>/</span>
        <span className="text-zinc-500 truncate max-w-[300px]">{tender.source_id}</span>
      </div>

      {/* Header card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {tender.issuer_region && (
              <span className="mono text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400 font-medium">
                {tender.issuer_region} — {getCantonName(tender.issuer_region)}
              </span>
            )}
            <StatusChip status={tender.status} />
          </div>
          <AddToTrackerButton tenderId={tender.id} />
        </div>

        <h1 className="text-xl font-semibold text-zinc-100 leading-snug mb-3">
          {tender.title}
        </h1>

        <p className="text-sm text-zinc-400 font-mono mb-4">{tender.issuer_name}</p>

        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-800">
          <Metric
            label="Deadline"
            value={
              <DeadlineBadge date={tender.response_deadline} showDate />
            }
          />
          <Metric
            label="Posted"
            value={<span className="mono text-sm text-zinc-300">{formatDate(tender.posted_date)}</span>}
          />
          <Metric
            label="Est. Value"
            value={
              <span className="mono text-sm text-zinc-300">
                {formatValueRange(tender.estimated_value_min, tender.estimated_value_max, tender.currency)}
              </span>
            }
          />
          <Metric
            label="Days Left"
            value={
              <span className={cn(
                "mono text-2xl font-bold",
                urgency === "critical" ? "text-red-400" :
                urgency === "warning"  ? "text-orange-400" :
                urgency === "expired"  ? "text-zinc-600" : "text-green-400"
              )}>
                {days !== null ? (days < 0 ? "—" : String(days)) : "—"}
              </span>
            }
          />
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          {tender.description && (
            <Section title="Description">
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                {tender.description}
              </p>
            </Section>
          )}

          {/* CPV Codes */}
          {tender.cpv_codes.length > 0 && (
            <Section title="CPV Classification">
              <div className="space-y-2">
                {tender.cpv_codes.map((code) => (
                  <div key={code} className="flex items-center gap-2">
                    <CpvBadge code={code} size="md" />
                    <span className="text-xs text-zinc-400">{getCpvLabel(code)}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Attachments */}
          {tender.attachments.length > 0 && (
            <Section title="Documents">
              <div className="space-y-1.5">
                {tender.attachments.map((att, i) => (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all group"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-zinc-500 shrink-0">
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-zinc-300 group-hover:text-white truncate flex-1">{att.name}</span>
                    {att.size_bytes && (
                      <span className="mono text-xs text-zinc-600 shrink-0">
                        {(att.size_bytes / 1024).toFixed(0)} KB
                      </span>
                    )}
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 shrink-0">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </a>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Contacts */}
          {tender.contacts.length > 0 && (
            <Section title="Contact">
              <div className="space-y-3">
                {tender.contacts.map((c, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="text-sm font-medium text-zinc-200">{c.name}</p>
                    {c.role && <p className="text-xs text-zinc-500">{c.role}</p>}
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="text-xs text-amber-400 hover:underline mono block">
                        {c.email}
                      </a>
                    )}
                    {c.phone && (
                      <p className="text-xs text-zinc-400 mono">{c.phone}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Meta */}
          <Section title="Details">
            <div className="space-y-2 text-xs mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Source ID</span>
                <span className="text-zinc-300">{tender.source_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Currency</span>
                <span className="text-zinc-300">{tender.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Last updated</span>
                <span className="text-zinc-300">{formatDate(tender.updated_at)}</span>
              </div>
            </div>
          </Section>

          {/* Source link */}
          {tender.source_url && (
            <a
              href={tender.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 text-sm mono transition-all"
            >
              View on simap.ch
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
      <h2 className="text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs mono text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
      <div>{value}</div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const config: Record<string, string> = {
    active:    "bg-green-950/50 text-green-400 border-green-900",
    expired:   "bg-zinc-800 text-zinc-500 border-zinc-700",
    cancelled: "bg-red-950/50 text-red-400 border-red-900",
    awarded:   "bg-blue-950/50 text-blue-400 border-blue-900",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded border text-xs mono font-medium", config[status] ?? config.active)}>
      {status}
    </span>
  );
}
