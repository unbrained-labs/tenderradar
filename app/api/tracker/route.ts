import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const rows = await sql`
      SELECT
        tr.id, tr.tender_id, tr.status, tr.notes, tr.assigned_to,
        tr.created_at, tr.updated_at,
        t.title, t.issuer_name, t.issuer_canton,
        t.cpv_codes, t.response_deadline,
        t.estimated_value_min, t.estimated_value_max, t.currency,
        t.source_url, t.status as tender_status
      FROM tracked_tenders tr
      LEFT JOIN tenders t ON t.id = tr.tender_id
      ORDER BY tr.updated_at DESC
    `;

    const items = rows.map((row) => ({
      id:          String(row.id),
      tender_id:   String(row.tender_id),
      status:      row.status,
      notes:       row.notes ?? null,
      assigned_to: row.assigned_to ?? null,
      created_at:  String(row.created_at),
      updated_at:  String(row.updated_at),
      tender: row.title ? {
        id:               String(row.tender_id),
        source_id:        "",
        title:            String(row.title),
        description:      null,
        issuer_name:      String(row.issuer_name ?? ""),
        issuer_canton:    row.issuer_canton ? String(row.issuer_canton) : null,
        cpv_codes:        Array.isArray(row.cpv_codes) ? row.cpv_codes : [],
        posted_date:      "",
        response_deadline: row.response_deadline ? String(row.response_deadline) : null,
        estimated_value_min: row.estimated_value_min != null ? Number(row.estimated_value_min) : null,
        estimated_value_max: row.estimated_value_max != null ? Number(row.estimated_value_max) : null,
        currency:         String(row.currency ?? "CHF"),
        status:           row.tender_status ?? "active",
        source_url:       String(row.source_url ?? ""),
        attachments:      [],
        contacts:         [],
        created_at:       "",
        updated_at:       "",
      } : null,
    }));

    return NextResponse.json(items);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tender_id, status = "new" } = await req.json();

    if (!tender_id) {
      return NextResponse.json({ error: "tender_id required" }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO tracked_tenders (tender_id, status)
      VALUES (${tender_id}, ${status})
      ON CONFLICT (tender_id) DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING id, tender_id, status, notes, assigned_to, created_at, updated_at
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
