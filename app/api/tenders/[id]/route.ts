import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { Tender } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const rows = await sql`
      SELECT
        id, source_id, title, description, issuer_name, issuer_canton,
        cpv_codes, posted_date, response_deadline,
        estimated_value_min, estimated_value_max, currency,
        status, source_url, attachments, contacts,
        created_at, updated_at
      FROM tenders
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const row = rows[0];
    const tender: Tender = {
      id:               String(row.id),
      source_id:        String(row.source_id),
      title:            String(row.title ?? ""),
      description:      row.description ? String(row.description) : null,
      issuer_name:      String(row.issuer_name ?? ""),
      issuer_canton:    row.issuer_canton ? String(row.issuer_canton) : null,
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

    return NextResponse.json(tender);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
