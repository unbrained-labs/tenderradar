import { sql } from "@/lib/db";
import type { TrackedTender } from "@/lib/types";
import TrackerBoard from "@/components/tracker-board";

export const dynamic = "force-dynamic";

export default async function TrackerPage() {
  const rows = await sql`
    SELECT
      tr.id, tr.tender_id, tr.status, tr.notes, tr.assigned_to,
      tr.created_at, tr.updated_at,
      t.id as t_id, t.title, t.issuer_name, t.issuer_canton,
      t.cpv_codes, t.response_deadline,
      t.estimated_value_min, t.estimated_value_max, t.currency,
      t.source_url, t.status as tender_status
    FROM tracked_tenders tr
    LEFT JOIN tenders t ON t.id = tr.tender_id
    ORDER BY tr.updated_at DESC
  `;

  const items: TrackedTender[] = rows.map((row) => ({
    id:          String(row.id),
    tender_id:   String(row.tender_id),
    status:      row.status as TrackedTender["status"],
    notes:       row.notes ?? null,
    assigned_to: row.assigned_to ?? null,
    created_at:  String(row.created_at),
    updated_at:  String(row.updated_at),
    tender: row.t_id ? {
      id:               String(row.t_id),
      source_id:        "",
      title:            String(row.title ?? ""),
      description:      null,
      issuer_name:      String(row.issuer_name ?? ""),
      issuer_canton:    row.issuer_canton ? String(row.issuer_canton) : null,
      cpv_codes:        Array.isArray(row.cpv_codes) ? row.cpv_codes as string[] : [],
      posted_date:      "",
      response_deadline: row.response_deadline ? String(row.response_deadline) : null,
      estimated_value_min: row.estimated_value_min != null ? Number(row.estimated_value_min) : null,
      estimated_value_max: row.estimated_value_max != null ? Number(row.estimated_value_max) : null,
      currency:         String(row.currency ?? "CHF"),
      status:           (row.tender_status ?? "active") as "active",
      source_url:       String(row.source_url ?? ""),
      attachments:      [],
      contacts:         [],
      created_at:       "",
      updated_at:       "",
    } : undefined,
  }));

  const total = items.length;
  const active = items.filter((i) => !["no_bid", "won", "lost"].includes(i.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Tracker</h1>
          <p className="text-sm text-zinc-500 mt-0.5 mono">
            {active} active · {total} total
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs mono text-zinc-600">
          Drag cards to move between columns
        </div>
      </div>

      <TrackerBoard initial={items} />
    </div>
  );
}
