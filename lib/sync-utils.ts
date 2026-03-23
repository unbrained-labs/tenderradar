import { NextRequest, NextResponse } from "next/server";
import { sql, rawQuery } from "@/lib/db";
import type { NormalizedTender } from "@/lib/types";

export const SOURCE_IDS = {
  simap: "simap.ch",
  ted: "ted.europa.eu",
  fts: "find-tender.service.gov.uk",
  sam: "sam.gov",
} as const;

/**
 * Batch-upsert normalized tenders using a single UNNEST query.
 * Replaces the N+1 sequential INSERT loop — all rows in one DB roundtrip.
 */
export async function batchUpsertTenders(tenders: NormalizedTender[]): Promise<number> {
  if (tenders.length === 0) return 0;

  // Pass everything as text[] — Postgres casts in the SELECT
  const col = <T>(fn: (t: NormalizedTender) => T) =>
    tenders.map((t) => {
      const v = fn(t);
      return v == null ? null : String(v);
    });

  await rawQuery(
    `INSERT INTO tenders (
        source_id, title, description, issuer_name, issuer_country, issuer_region,
        cpv_codes, posted_date, response_deadline,
        estimated_value_min, estimated_value_max, currency,
        status, source_url, attachments, contacts, raw
      )
      SELECT
        source_id, title, description, issuer_name, issuer_country, issuer_region,
        cpv_codes::jsonb,
        posted_date::timestamptz,
        response_deadline::timestamptz,
        estimated_value_min::numeric,
        estimated_value_max::numeric,
        currency, status, source_url,
        attachments::jsonb,
        contacts::jsonb,
        raw::jsonb
      FROM UNNEST(
        $1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[],
        $7::text[], $8::text[], $9::text[], $10::text[], $11::text[], $12::text[],
        $13::text[], $14::text[], $15::text[], $16::text[], $17::text[]
      ) AS t(
        source_id, title, description, issuer_name, issuer_country, issuer_region,
        cpv_codes, posted_date, response_deadline,
        estimated_value_min, estimated_value_max, currency,
        status, source_url, attachments, contacts, raw
      )
      ON CONFLICT (source_id) DO UPDATE SET
        title             = EXCLUDED.title,
        description       = EXCLUDED.description,
        issuer_name       = EXCLUDED.issuer_name,
        issuer_country    = EXCLUDED.issuer_country,
        issuer_region     = EXCLUDED.issuer_region,
        cpv_codes         = EXCLUDED.cpv_codes,
        response_deadline = EXCLUDED.response_deadline,
        status            = EXCLUDED.status,
        attachments       = EXCLUDED.attachments,
        contacts          = EXCLUDED.contacts,
        raw               = EXCLUDED.raw,
        updated_at        = NOW()`,
    [
      col((t) => t.source_id),
      col((t) => t.title),
      col((t) => t.description),
      col((t) => t.issuer_name),
      col((t) => t.issuer_country),
      col((t) => t.issuer_region),
      col((t) => JSON.stringify(t.cpv_codes)),
      col((t) => t.posted_date),
      col((t) => t.response_deadline),
      col((t) => t.estimated_value_min),
      col((t) => t.estimated_value_max),
      col((t) => t.currency),
      col((t) => t.status),
      col((t) => t.source_url),
      col((t) => JSON.stringify(t.attachments)),
      col((t) => JSON.stringify(t.contacts)),
      col((t) => JSON.stringify(t.raw)),
    ]
  );

  return tenders.length;
}

/**
 * Shared sync route handler.
 * Handles auth, sync_log lifecycle, batch upsert, expiry sweep, and error response.
 * Each route only needs to supply the source name and a fetch function.
 */
export async function runSyncRoute(
  req: NextRequest,
  source: string,
  fetchTenders: () => Promise<NormalizedTender[]>
): Promise<NextResponse> {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let logId: string;
  try {
    const [row] = await sql`
      INSERT INTO sync_log (source, status)
      VALUES (${source}, 'running')
      RETURNING id
    `;
    logId = row.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${source} sync: failed to create log entry:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    const tenders = await fetchTenders();
    const upserted = await batchUpsertTenders(tenders);

    // Mark expired tenders across all sources
    await sql`
      UPDATE tenders
      SET status = 'expired'
      WHERE status = 'active'
        AND response_deadline IS NOT NULL
        AND response_deadline < NOW() - INTERVAL '1 day'
    `;

    await sql`
      UPDATE sync_log
      SET status = 'success', finished_at = NOW(),
          records_fetched = ${tenders.length}, records_upserted = ${upserted}
      WHERE id = ${logId}
    `;

    return NextResponse.json({ ok: true, fetched: tenders.length, upserted });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await sql`
      UPDATE sync_log
      SET status = 'error', finished_at = NOW(), error = ${message}
      WHERE id = ${logId}
    `;
    console.error(`${source} sync error:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
