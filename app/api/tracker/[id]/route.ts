import { NextRequest, NextResponse } from "next/server";
import { sql, rawQuery } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, notes, assigned_to } = body;

    // Build partial update
    const updates: string[] = ["updated_at = NOW()"];
    if (status !== undefined) updates.push(`status = '${status}'`);
    if (notes !== undefined) updates.push(`notes = $1`);
    if (assigned_to !== undefined) updates.push(`assigned_to = '${assigned_to}'`);

    if (notes !== undefined) {
      const rows = await rawQuery(
        `UPDATE tracked_tenders SET updated_at = NOW(), status = COALESCE($1, status), notes = $2 WHERE id = $3 RETURNING *`,
        [status ?? null, notes, params.id]
      );
      return NextResponse.json(rows[0]);
    }

    const rows = await sql`
      UPDATE tracked_tenders
      SET
        status       = COALESCE(${status ?? null}, status),
        assigned_to  = COALESCE(${assigned_to ?? null}, assigned_to),
        updated_at   = NOW()
      WHERE id = ${params.id}
      RETURNING id, tender_id, status, notes, assigned_to, updated_at
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await sql`DELETE FROM tracked_tenders WHERE id = ${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
