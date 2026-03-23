import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { fetchAllOpenTenders } from "@/lib/simap";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ id: logId }] = await sql`
    INSERT INTO sync_log (source, status)
    VALUES ('simap.ch', 'running')
    RETURNING id
  `;

  try {
    const tenders = await fetchAllOpenTenders({
      maxPages: 10,
      pageSize: 20,  // simap default page size
      delayMs: 200,
    });

    let upserted = 0;

    for (const t of tenders) {
      await sql`
        INSERT INTO tenders (
          source_id, title, description, issuer_name, issuer_canton,
          cpv_codes, posted_date, response_deadline,
          estimated_value_min, estimated_value_max, currency,
          status, source_url, attachments, contacts, raw
        ) VALUES (
          ${t.source_id},
          ${t.title},
          ${t.description},
          ${t.issuer_name},
          ${t.issuer_canton},
          ${JSON.stringify(t.cpv_codes)},
          ${t.posted_date},
          ${t.response_deadline},
          ${t.estimated_value_min},
          ${t.estimated_value_max},
          ${t.currency},
          ${t.status},
          ${t.source_url},
          ${JSON.stringify(t.attachments)},
          ${JSON.stringify(t.contacts)},
          ${JSON.stringify(t.raw)}
        )
        ON CONFLICT (source_id) DO UPDATE SET
          title              = EXCLUDED.title,
          description        = EXCLUDED.description,
          issuer_name        = EXCLUDED.issuer_name,
          issuer_canton      = EXCLUDED.issuer_canton,
          cpv_codes          = EXCLUDED.cpv_codes,
          response_deadline  = EXCLUDED.response_deadline,
          status             = EXCLUDED.status,
          attachments        = EXCLUDED.attachments,
          contacts           = EXCLUDED.contacts,
          raw                = EXCLUDED.raw,
          updated_at         = NOW()
      `;
      upserted++;
    }

    // Mark tenders whose deadline has passed
    await sql`
      UPDATE tenders
      SET status = 'expired'
      WHERE status = 'active'
        AND response_deadline IS NOT NULL
        AND response_deadline < NOW() - INTERVAL '1 day'
    `;

    await sql`
      UPDATE sync_log
      SET status = 'success',
          finished_at = NOW(),
          records_fetched = ${tenders.length},
          records_upserted = ${upserted}
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
    console.error("Sync error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
