import { NextRequest, NextResponse } from "next/server";
import { sql, rawQuery } from "@/lib/db";
import type { Tender } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const keyword    = searchParams.get("keyword");
  const cantons    = searchParams.getAll("canton");
  const cpvPrefix  = searchParams.get("cpv");
  const valueMin   = searchParams.get("value_min");
  const valueMax   = searchParams.get("value_max");
  const status     = searchParams.get("status") ?? "active";
  const page       = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize   = Math.min(100, Number(searchParams.get("page_size") ?? "25"));
  const offset     = (page - 1) * pageSize;

  try {
    // Build dynamic WHERE clauses
    // Using parameterized queries via template literals (neon handles this)
    const conditions: string[] = ["1=1"];
    const values: (string | number | null)[] = [];
    let paramIdx = 1;

    if (status !== "all") {
      conditions.push(`t.status = $${paramIdx++}`);
      values.push(status);
    }

    if (cantons.length > 0) {
      const placeholders = cantons.map(() => `$${paramIdx++}`).join(", ");
      conditions.push(`t.issuer_region IN (${placeholders})`);
      values.push(...cantons);
    }

    if (cpvPrefix) {
      conditions.push(`EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(t.cpv_codes) AS code
        WHERE code LIKE $${paramIdx++}
      )`);
      values.push(`${cpvPrefix}%`);
    }

    if (valueMin) {
      conditions.push(`(t.estimated_value_max IS NULL OR t.estimated_value_max >= $${paramIdx++})`);
      values.push(Number(valueMin));
    }

    if (valueMax) {
      conditions.push(`(t.estimated_value_min IS NULL OR t.estimated_value_min <= $${paramIdx++})`);
      values.push(Number(valueMax));
    }

    if (keyword) {
      conditions.push(`(
        t.title ILIKE $${paramIdx} OR
        t.description ILIKE $${paramIdx} OR
        t.issuer_name ILIKE $${paramIdx}
      )`);
      values.push(`%${keyword}%`);
      paramIdx++;
    }

    const whereClause = conditions.join(" AND ");

    // Due to neon's tagged template limitation with dynamic queries,
    // we use the raw sql.query method here
    const countRows = await rawQuery<{ total: string }>(
      `SELECT COUNT(*) as total FROM tenders t WHERE ${whereClause}`,
      values
    );

    const total = Number(countRows[0]?.total ?? 0);

    const dataRows = await rawQuery<Record<string, unknown>>(
      `SELECT
         id, source_id, title, description, issuer_name, issuer_region,
         cpv_codes, posted_date, response_deadline,
         estimated_value_min, estimated_value_max, currency,
         status, source_url, attachments, contacts,
         created_at, updated_at
       FROM tenders t
       WHERE ${whereClause}
       ORDER BY
         CASE WHEN t.response_deadline IS NULL THEN 1 ELSE 0 END,
         t.response_deadline ASC,
         t.posted_date DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...values, pageSize, offset]
    );

    const tenders: Tender[] = dataRows.map(normalizeRow);

    return NextResponse.json({
      tenders,
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("GET /api/tenders error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function normalizeRow(row: Record<string, unknown>): Tender {
  return {
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
}
